import { create } from "zustand";
import api from "@/lib/api";
import { TOKEN_KEY } from "@/lib/constants";
import type { User, TokenResponse } from "@/types";

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post<TokenResponse>("/auth/login", {
        email,
        password,
      });
      localStorage.setItem(TOKEN_KEY, data.access_token);
      set({ token: data.access_token });

      // Obtener datos del usuario tras login
      const userRes = await api.get<User>("/auth/me");
      set({ user: userRes.data, isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || "Error al iniciar sesion";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/register", { email, password, name });

      // Login automatico tras registro
      const { data } = await api.post<TokenResponse>("/auth/login", {
        email,
        password,
      });
      localStorage.setItem(TOKEN_KEY, data.access_token);
      set({ token: data.access_token });

      const userRes = await api.get<User>("/auth/me");
      set({ user: userRes.data, isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || "Error al registrarse";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      set({ isLoading: false });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || "Error al cambiar la contraseña";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null, error: null });
  },

  fetchUser: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    try {
      const { data } = await api.get<User>("/auth/me");
      set({ user: data });
    } catch {
      // Token invalido o expirado
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, user: null });
    }
  },

  clearError: () => set({ error: null }),
}));
