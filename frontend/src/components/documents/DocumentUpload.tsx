import { useState, useRef, type DragEvent } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useUploadDocument } from "@/hooks/useDocuments";

const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];
const MAX_SIZE_MB = 50;

export default function DocumentUpload() {
  const upload = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Validar archivo antes de subir
  const validateFile = (file: File): string | null => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Tipo '${ext}' no permitido. Usa: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Archivo demasiado grande. Maximo: ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const handleUpload = (file: File) => {
    setUploadError("");
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    upload.mutate(file, {
      onError: (err: unknown) => {
        const message =
          (err as { response?: { data?: { detail?: string } } }).response?.data
            ?.detail || "Error al subir el archivo";
        setUploadError(message);
      },
    });
  };

  // Drag & drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) handleUpload(file);
    
    // Limpiar input para permitir subir el mismo archivo
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Zona de drag-and-drop */}
      <div
        role="button"
        aria-label="Subir archivo: arrastra aquí o pulsa para seleccionar un PDF, DOCX o TXT"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer border-[3px] border-dashed p-8 text-center
          transition-all duration-100
          ${
            isDragging
              ? "border-accent-blue bg-accent-blue/5 scale-[1.02]"
              : "border-pencil/40 bg-white hover:border-pencil hover:shadow-hand-sm"
          }
          ${upload.isPending ? "pointer-events-none opacity-60" : ""}`}
        style={{
          borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
          aria-label="Seleccionar archivo para subir"
          className="hidden"
        />

        {upload.isPending ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin">
              <FileText size={40} strokeWidth={2} className="text-accent-blue" />
            </div>
            <p className="font-body text-lg text-pencil">Subiendo archivo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload
              size={40}
              strokeWidth={2.5}
              className={isDragging ? "text-accent-blue" : "text-pencil/50"}
            />
            <p className="font-body text-xl text-pencil">
              Arrastra un archivo aqui o{" "}
              <span className="text-accent-blue underline">haz click</span>
            </p>
            <p className="font-body text-pencil/50">
              PDF, DOCX o TXT (max {MAX_SIZE_MB}MB)
            </p>
          </div>
        )}
      </div>

      {/* Error en la subida */}
      {uploadError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 bg-accent/10 border-2 border-accent font-body text-accent"
          style={{
            borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
          }}
        >
          <AlertCircle size={18} strokeWidth={2.5} />
          {uploadError}
        </div>
      )}

      {/* Confirmacion de subida exitosa */}
      {upload.isSuccess && !uploadError && (
        <div
          role="status"
          className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-600 font-body text-green-700"
          style={{
            borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
          }}
        >
          <FileText size={18} strokeWidth={2.5} />
          Archivo subido. Indexando...
        </div>
      )}
    </div>
  );
}
