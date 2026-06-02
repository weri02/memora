import { useEffect } from "react";
import { Plus, MessageCircle, Trash2 } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";

interface ChatSidebarProps {
  onSelectConversation?: () => void;
}

export default function ChatSidebar({ onSelectConversation }: ChatSidebarProps) {
  const {
    conversations,
    activeConversationId,
    isLoadingConversations,
    fetchConversations,
    createConversation,
    deleteConversation,
    selectConversation,
  } = useChatStore();

  // Cargar conversaciones al montar
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleCreate = async () => {
    const conv = await createConversation();
    selectConversation(conv.id);
    onSelectConversation?.();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Boton nueva conversacion */}
      <button
        onClick={handleCreate}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 mb-4 font-body text-lg
          bg-white text-pencil border-[3px] border-pencil shadow-hand
          hover:bg-accent hover:text-white hover:shadow-hand-sm hover:translate-x-[2px] hover:translate-y-[2px]
          active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
          transition-all duration-100"
        style={{
          borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
        }}
      >
        <Plus size={20} strokeWidth={2.5} />
        Nueva conversacion
      </button>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoadingConversations && (
          <p className="font-body text-pencil/40 text-center py-4">
            Cargando...
          </p>
        )}

        {!isLoadingConversations && conversations.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle
              size={32}
              strokeWidth={1.5}
              className="text-pencil/20 mx-auto mb-2"
            />
            <p className="font-body text-pencil/40">Sin conversaciones</p>
          </div>
        )}

        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`relative group flex items-center border-2 transition-all duration-100
              ${
                activeConversationId === conv.id
                  ? "bg-accent text-white border-accent shadow-hand-sm"
                  : "bg-white text-pencil border-pencil/30 hover:border-pencil hover:shadow-hand-sm"
              }`}
            style={{
              borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
            }}
          >
            {/* Boton seleccionar conversacion */}
            <button
              onClick={() => { selectConversation(conv.id); onSelectConversation?.(); }}
              className="flex-1 flex items-center gap-2 px-3 py-2.5 pr-9 text-left font-body min-w-0"
            >
              <MessageCircle size={16} strokeWidth={2.5} className="flex-shrink-0" />
              <span className="flex-1 truncate">{conv.titulo}</span>
            </button>

            {/* Boton eliminar */}
            <button
              type="button"
              onClick={(e) => handleDelete(e, conv.id)}
              aria-label={`Eliminar conversación ${conv.titulo}`}
              className={`absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0 p-1 rounded
                opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity
                ${
                  activeConversationId === conv.id
                    ? "hover:bg-white/20"
                    : "hover:bg-accent/10 hover:text-accent"
                }`}
            >
              <Trash2 size={14} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
