import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { supabase } from "../services/supabaseClient";
import AuthLayout from "../components/AuthLayout";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message || "";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Reset error state saat user mengetik ulang
    if (isEmailNotConfirmed) setIsEmailNotConfirmed(false);
  };

  const handleGoToVerify = () => {
    navigate("/verify-otp", { state: { email: formData.email } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsEmailNotConfirmed(false);
    setLoading(true);

    try {
      // Login menggunakan Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      // === DEBUGGING ===
      console.log("[DEBUG LOGIN] Login Berhasil!");
      console.log("[DEBUG LOGIN] Token JWT didapatkan:", data.session.access_token.substring(0, 30) + "...");
      // =================

      // Sesuai instruksi: Simpan token JWT ke localStorage DULU
      if (data?.session?.access_token) {
        localStorage.setItem("token", data.session.access_token);
        console.log("[DEBUG LOGIN] Token JWT berhasil disimpan ke localStorage.");
      }
      
      // Simpan data.user ke localStorage agar dapat dibaca di Profile.jsx dan Layout.jsx
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      console.log("[DEBUG LOGIN] Akan melakukan GET Profile setelah token masuk localStorage.");

      // Ambil profile dari backend, biarkan api.js (interceptor) yang otomatis ambil dari localStorage
      const profileResponse = await api.get("/api/profile").catch((err) => {
        console.error("Gagal mengambil profil:", err);
        return null;
      });
      
      const profile = profileResponse?.data?.data?.profile;
      if (profile) {
        localStorage.setItem("profile", JSON.stringify(profile));
      }

      // Arahkan ke halaman onboarding atau dashboard
      if (profile && profile.onboarding_completed) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch (err) {
      const message = err.message || err.response?.data?.message || "Terjadi kesalahan saat login";
      setError(message);
      if (message.toLowerCase().includes("email not confirmed")) {
        setIsEmailNotConfirmed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome Back!" 
      subtitle="Sign in to continue managing your UMKM finances efficiently."
      showSocial={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4 flex flex-col flex-grow">
        {successMessage && (
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm text-center border border-emerald-100 font-medium">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center border border-red-100 font-medium">
            <p>{error}</p>
            {isEmailNotConfirmed && (
              <button
                type="button"
                onClick={handleGoToVerify}
                className="mt-2 inline-block bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Verifikasi Sekarang →
              </button>
            )}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-600 ml-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-400 focus:bg-white outline-none transition-all text-sm placeholder:text-slate-400"
            placeholder="Input your email"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-600 ml-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-orange-400 focus:bg-white outline-none transition-all text-sm placeholder:text-slate-400"
            placeholder="Input your password"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] flex justify-center items-center"
          >
            {loading ? "Processing..." : "Sign In"}
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          By continuing with Google, Apple, or Email, you agree to 
          UMKM Finance <a href="#" className="font-semibold underline">Terms of Service</a> and <a href="#" className="font-semibold underline">Privacy Policy</a>.
        </p>

        <p className="mt-auto pt-6 text-center text-sm font-medium text-slate-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-slate-900 hover:text-orange-500 font-bold transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
