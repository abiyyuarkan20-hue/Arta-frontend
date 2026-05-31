import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./services/supabaseClient";
import api from "./services/api";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Onboarding from "./pages/Onboarding";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Recommendations from "./pages/Recommendations";
import Forecasting from "./pages/Forecasting";
import Settings from "./pages/Settings";

// Komponen inisialisasi sesi otentikasi global
const AuthInit = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session && !localStorage.getItem("token")) {
          console.log("[DEBUG AUTHINIT] Session found, syncing to localStorage...");
          localStorage.setItem("token", session.access_token);
          localStorage.setItem("refreshToken", session.refresh_token);
          localStorage.setItem("user", JSON.stringify(session.user));

          // Ambil profile dari backend
          const profileResponse = await api.get("/api/profile").catch((err) => {
            console.error("Gagal mengambil profil via AuthInit:", err);
            return null;
          });
          
          const profile = profileResponse?.data?.data?.profile;
          if (profile) {
            localStorage.setItem("profile", JSON.stringify(profile));
          }
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && !localStorage.getItem("token")) {
        console.log("[DEBUG AUTHINIT] Auth state changed, syncing...");
        localStorage.setItem("token", session.access_token);
        localStorage.setItem("refreshToken", session.refresh_token);
        localStorage.setItem("user", JSON.stringify(session.user));

        try {
          const profileResponse = await api.get("/api/profile");
          const profile = profileResponse?.data?.data?.profile;
          if (profile) {
            localStorage.setItem("profile", JSON.stringify(profile));
          }
        } catch (err) {
          console.error("Gagal mengambil profil via AuthInit change:", err);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-semibold tracking-wide">Menginisialisasi sesi...</p>
        </div>
      </div>
    );
  }

  return children;
};

// Komponen untuk melindungi rute yang butuh login
// Juga redirect ke /onboarding jika profil belum lengkap (onboarding_completed = false)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Redirect ke onboarding HANYA jika onboarding_completed === false (strict)
  // null/undefined (profil baru / tidak ditemukan) TIDAK trigger redirect
  if (location.pathname !== "/onboarding") {
    const shouldRedirect = (() => {
      try {
        const profileStr = localStorage.getItem("profile");
        if (!profileStr) return false;
        const profile = JSON.parse(profileStr);
        return profile.onboarding_completed === false;
      } catch {
        return false;
      }
    })();
    if (shouldRedirect) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthInit>
        <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        
        {/* Rute Onboarding */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } 
        />

        {/* Rute Aplikasi Utama (Diproteksi) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="forecasting" element={<Forecasting />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback ke Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AuthInit>
    </BrowserRouter>
  );
}

export default App;
