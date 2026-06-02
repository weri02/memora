import { Link, useLocation } from "react-router-dom";
import { FileText, MessageCircle, LogOut, Settings } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="border-b-[3px] border-pencil bg-paper/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-2 md:px-4 h-14 md:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/documents"
          className="font-heading text-xl md:text-2xl font-bold text-pencil hover:text-accent transition-colors"
        >
          Memora
        </Link>

        {/* Navegacion central */}
        <div className="flex items-center gap-1 md:gap-2">
          <Link
            to="/documents"
            className={`flex items-center gap-1.5 md:gap-2 p-2 md:px-4 md:py-2 font-body text-base md:text-lg border-[2px] md:border-[3px] border-pencil transition-all duration-100
              ${
                isActive("/documents")
                  ? "bg-accent text-white md:shadow-hand-sm md:translate-x-[2px] md:translate-y-[2px]"
                  : "bg-white text-pencil md:shadow-hand hover:bg-accent hover:text-white md:hover:shadow-hand-sm md:hover:translate-x-[2px] md:hover:translate-y-[2px]"
              }`}
            style={{
              borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
            }}
          >
            <FileText size={18} strokeWidth={2.5} />
            <span className="hidden md:inline">Documentos</span>
          </Link>

          <Link
            to="/chat"
            className={`flex items-center gap-1.5 md:gap-2 p-2 md:px-4 md:py-2 font-body text-base md:text-lg border-[2px] md:border-[3px] border-pencil transition-all duration-100
              ${
                isActive("/chat")
                  ? "bg-accent text-white md:shadow-hand-sm md:translate-x-[2px] md:translate-y-[2px]"
                  : "bg-white text-pencil md:shadow-hand hover:bg-accent hover:text-white md:hover:shadow-hand-sm md:hover:translate-x-[2px] md:hover:translate-y-[2px]"
              }`}
            style={{
              borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
            }}
          >
            <MessageCircle size={18} strokeWidth={2.5} />
            <span className="hidden md:inline">Chat</span>
          </Link>
        </div>

        {/* Usuario + ajustes + logout */}
        <div className="flex items-center gap-2 md:gap-3">
          <span className="font-body text-pencil text-lg hidden md:block">
            {user?.name}
          </span>
          <Link
            to="/settings"
            aria-label="Ajustes de cuenta"
            aria-current={isActive("/settings") ? "page" : undefined}
            className={`flex items-center p-1.5 md:p-2 border-2 border-pencil shadow-hand-sm
              transition-all duration-100
              hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none
              ${
                isActive("/settings")
                  ? "bg-accent text-white border-accent"
                  : "bg-muted text-pencil hover:bg-accent hover:text-white hover:border-accent"
              }`}
            style={{
              borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
            }}
            title="Ajustes"
          >
            <Settings size={16} strokeWidth={2.5} />
          </Link>
          <button
            onClick={logout}
            aria-label="Cerrar sesion"
            className="flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 font-body text-pencil border-2 border-pencil bg-muted shadow-hand-sm
              hover:bg-accent hover:text-white hover:border-accent transition-all duration-100
              hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            style={{
              borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
            }}
            title="Cerrar sesion"
          >
            <LogOut size={16} strokeWidth={2.5} />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
