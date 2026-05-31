import axios from "axios";
import { supabase } from "./supabaseClient";

// Membuat instance axios dengan konfigurasi dasar
const api = axios.create({
  // Dev: proxy Vite menangani /api → Vercel. Build: langsung ke VITE_API_BASE_URL.
  baseURL: import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL || "https://arta-backend-nine.vercel.app"),
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// REQUEST INTERCEPTOR
// Menyisipkan JWT Token (Supabase) ke header Authorization
// ==========================================
api.interceptors.request.use(
  async (config) => {
    // Sesuai instruksi Anda: Ambil token yang disimpan di localStorage
    const token = localStorage.getItem("token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[DEBUG API] Menyiapkan Request ke: ${config.url}`);
      console.log(`[DEBUG API] Token JWT dari localStorage disematkan ke Header: Bearer ${token.substring(0, 20)}...`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// RESPONSE INTERCEPTOR
// Tangani error secara global
// ==========================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Jika masih 401, berarti sesi Supabase benar-benar mati/expired parah
    if (error.response?.status === 401 && !error.config.url.includes("/auth/")) {
      await supabase.auth.signOut();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
