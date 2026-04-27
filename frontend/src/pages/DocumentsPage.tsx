import { FileText, Database, Layers } from "lucide-react";
import { useDocumentStats } from "@/hooks/useDocuments";
import DocumentUpload from "@/components/documents/DocumentUpload";
import DocumentList from "@/components/documents/DocumentList";

export default function DocumentsPage() {
  const { data: stats } = useDocumentStats();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-heading text-4xl font-bold text-pencil">
          Mis Documentos
        </h1>

        {stats && stats.total_documents > 0 && (
          <div className="flex gap-4">
            <div className="flex items-center gap-2 font-body text-pencil/70">
              <FileText size={18} strokeWidth={2.5} />
              <span>{stats.total_documents} docs</span>
            </div>
            <div className="flex items-center gap-2 font-body text-pencil/70">
              <Layers size={18} strokeWidth={2.5} />
              <span>{stats.total_chunks} chunks</span>
            </div>
            {stats.by_status.indexed && (
              <div className="flex items-center gap-2 font-body text-green-700">
                <Database size={18} strokeWidth={2.5} />
                <span>{stats.by_status.indexed} indexados</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zona de upload */}
      <DocumentUpload />

      {/* Lista de documentos */}
      <DocumentList />
    </div>
  );
}
