import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/authStore";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DocumentsPage from "@/pages/DocumentsPage";
import ChatPage from "@/pages/ChatPage";

function AppRoutes() {
  const { token, fetchUser } = useAuthStore();

  // Obtener datos del usuario si hay token
  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token, fetchUser]);

  return (
    <Routes>
      {/* Rutas publicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas protegidas */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/documents" element={<DocumentsPage />} />
      </Route>

      {/* Chat */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      {/* Redirect por defecto */}
      <Route path="*" element={<Navigate to="/documents" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
