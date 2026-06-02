import { useState } from "react";
import { Menu, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Boton toggle sidebar - solo movil */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Cerrar menú de conversaciones" : "Abrir menú de conversaciones"}
          aria-expanded={sidebarOpen}
          className="md:hidden absolute top-2 left-2 z-30 p-2 border-2 border-pencil bg-white text-pencil
            hover:bg-accent hover:text-white transition-all duration-100"
          style={{
            borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
          }}
        >
          {sidebarOpen ? <X size={18} strokeWidth={2.5} /> : <Menu size={18} strokeWidth={2.5} />}
        </button>

        {/* Overlay oscuro en movil cuando sidebar abierto */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar de conversaciones */}
        <div
          className={`
            absolute md:relative z-20 h-full
            w-72 flex-shrink-0 border-r-2 border-dashed border-pencil/20 p-3 bg-paper
            transition-transform duration-200 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
          `}
        >
          <ChatSidebar onSelectConversation={() => setSidebarOpen(false)} />
        </div>

        {/* Ventana de chat */}
        <ChatWindow />
      </div>
    </div>
  );
}
