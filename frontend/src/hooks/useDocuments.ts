import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { TOKEN_KEY } from "@/lib/constants";
import type { Document, DocumentStats } from "@/types";

// Lista de documentos del usuario
export function useDocuments() {
  return useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data } = await api.get("/documents/");
      return data;
    },
  });
}

// Estadisticas de documentos
export function useDocumentStats() {
  return useQuery<DocumentStats>({
    queryKey: ["document-stats"],
    queryFn: async () => {
      const { data } = await api.get("/documents/stats");
      return data;
    },
  });
}

// Subida de documento
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post<Document>("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-stats"] });
    },
  });
}

// Eliminar documento
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: number) => {
      await api.delete(`/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-stats"] });
    },
  });
}

// Suscribirse al stream SSE de eventos de documentos
export function useDocumentEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const evt = new EventSource(
      `/api/v1/documents/events?token=${encodeURIComponent(token)}`,
    );

    evt.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-stats"] });
    };

    evt.onerror = () => {
      // EventSource intenta reconectar automaticamente
    };

    return () => {
      evt.close();
    };
  }, [queryClient]);
}

// Re-indexar documento
export function useReindexDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: number) => {
      const { data } = await api.post<Document>(
        `/documents/${documentId}/reindex`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-stats"] });
    },
  });
}
