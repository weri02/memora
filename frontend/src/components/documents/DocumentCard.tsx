import { FileText, Trash2, RefreshCw, Clock, CheckCircle, AlertCircle, Loader } from "lucide-react";
import type { Document } from "@/types";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pendiente",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-600",
    icon: <Clock size={14} strokeWidth={2.5} />,
  },
  processing: {
    label: "Procesando",
    color: "text-accent-blue",
    bg: "bg-blue-50 border-accent-blue",
    icon: <Loader size={14} strokeWidth={2.5} className="animate-spin" />,
  },
  indexed: {
    label: "Indexado",
    color: "text-green-700",
    bg: "bg-green-50 border-green-600",
    icon: <CheckCircle size={14} strokeWidth={2.5} />,
  },
  error: {
    label: "Error",
    color: "text-accent",
    bg: "bg-red-50 border-accent",
    icon: <AlertCircle size={14} strokeWidth={2.5} />,
  },
};

interface Props {
  document: Document;
  onDelete: (id: number) => void;
  onReindex: (id: number) => void;
  isDeleting: boolean;
  isReindexing: boolean;
}

export default function DocumentCard({
  document: doc,
  onDelete,
  onReindex,
  isDeleting,
  isReindexing,
}: Props) {
  const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;

  return (
    <div
      className="bg-white border-2 border-pencil shadow-hand-card p-4 flex flex-col gap-3
        hover:shadow-hand transition-all duration-100"
      style={{
        borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
      }}
    >
      {/* Cabecera: icono + nombre + tipo */}
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-pencil bg-muted/50"
          style={{
            borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
          }}
        >
          <FileText size={20} strokeWidth={2.5} className="text-pencil" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-lg font-bold text-pencil truncate">
            {doc.original_filename}
          </p>
        </div>
      </div>

      {/* Badge de estado */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 border-2 font-body text-sm ${status.color} ${status.bg}`}
          style={{
            borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
          }}
        >
          {status.icon}
          {status.label}
          {doc.status === "indexed" && doc.chunk_count > 0 && (
            <span className="text-pencil/50 ml-1">({doc.chunk_count} chunks)</span>
          )}
        </span>
      </div>

      {/* Mensaje de error */}
      {doc.status === "error" && doc.error_message && (
        <p className="font-body text-sm text-accent bg-accent/5 p-2 border border-accent/20 rounded">
          {doc.error_message}
        </p>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-2 pt-1 border-t border-dashed border-pencil/20">
        {/* Re-indexar */}
        <button
          onClick={() => onReindex(doc.id)}
          disabled={isReindexing || doc.status === "processing"}
          className="flex items-center gap-1 px-3 py-1.5 font-body text-sm text-pencil
            border-2 border-pencil bg-white shadow-hand-sm
            hover:bg-accent-blue hover:text-white hover:border-accent-blue
            hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-100"
          style={{
            borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
          }}
        >
          <RefreshCw
            size={14}
            strokeWidth={2.5}
            className={isReindexing ? "animate-spin" : ""}
          />
          Re-indexar
        </button>

        {/* Eliminar */}
        <button
          onClick={() => onDelete(doc.id)}
          disabled={isDeleting}
          className="flex items-center gap-1 px-3 py-1.5 font-body text-sm text-pencil
            border-2 border-pencil bg-white shadow-hand-sm
            hover:bg-accent hover:text-white hover:border-accent
            hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-100"
          style={{
            borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
          }}
        >
          <Trash2 size={14} strokeWidth={2.5} />
          Eliminar
        </button>
      </div>
    </div>
  );
}
