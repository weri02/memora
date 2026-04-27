import { FileText } from "lucide-react";
import { useDocuments, useDeleteDocument, useReindexDocument } from "@/hooks/useDocuments";
import DocumentCard from "./DocumentCard";

export default function DocumentList() {
  const { data: documents, isLoading, error } = useDocuments();
  const deleteMutation = useDeleteDocument();
  const reindexMutation = useReindexDocument();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin inline-block">
          <FileText size={32} strokeWidth={2} className="text-pencil/40" />
        </div>
        <p className="font-body text-lg text-pencil/50 mt-2">
          Cargando documentos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 bg-accent/10 border-2 border-accent font-body text-accent text-center"
        style={{
          borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
        }}
      >
        Error al cargar documentos
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div
        className="text-center py-12 border-2 border-dashed border-pencil/20 bg-white"
        style={{
          borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
        }}
      >
        <FileText size={48} strokeWidth={1.5} className="text-pencil/20 mx-auto mb-3" />
        <p className="font-heading text-xl text-pencil/40">Sin documentos</p>
        <p className="font-body text-pencil/30">
          Sube tu primer PDF, DOCX o TXT
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onDelete={(id) => deleteMutation.mutate(id)}
          onReindex={(id) => reindexMutation.mutate(id)}
          isDeleting={deleteMutation.isPending && deleteMutation.variables === doc.id}
          isReindexing={reindexMutation.isPending && reindexMutation.variables === doc.id}
        />
      ))}
    </div>
  );
}
