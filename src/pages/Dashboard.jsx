import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import {
  FiTrendingUp,
  FiArrowUpRight,
  FiArrowDownRight,
  FiPieChart,
  FiActivity,
  FiArrowRight,
  FiCpu,
  FiCheckCircle,
  FiX,
  FiUser,
  FiMapPin,
  FiPhone,
  FiFileText,
  FiPlus,
  FiMinus,
  FiChevronDown,
  FiCalendar,
  FiClock,
  FiSearch,
  FiFilter,
  FiDownload,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

// Data fetch dari API Backend Arta

const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number || 0);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");
  const { t } = useTranslation();

  const [filterWaktu, setFilterWaktu] = useState("bulan_ini");

  // Data dari API
  const [dashboardData, setDashboardData] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Fitur Tabel Data Transaksi Dashboard
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Semua");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const storedProfile = localStorage.getItem("profile");
    const prof = storedProfile ? JSON.parse(storedProfile) : null;
    if (prof) setProfile(prof);

    // Cek flag popup setelah klik "Mulai Rencana Bisnis"
    const shouldPrompt = localStorage.getItem("show_profile_prompt");
    const bizName = localStorage.getItem("new_business_name") || "bisnis Anda";
    if (shouldPrompt === "true") {
      setNewBusinessName(bizName);
      // Delay sedikit agar page sudah render dulu
      setTimeout(() => setShowProfilePrompt(true), 500);
      localStorage.removeItem("show_profile_prompt");
      localStorage.removeItem("new_business_name");
    }

    if (prof?.user_type === "umkm_aktif") {
      setLoading(true);
      api
        .get(`/api/dashboard/overview?range=${filterWaktu}`)
        .then((res) => {
          setDashboardData(res.data);
          setApiError(null);
        })
        .catch((err) => {
          console.error("Gagal mengambil data dashboard:", err);
          setApiError(
            err.response?.data?.message ||
              "Gagal mengambil data. Server mungkin sedang offline.",
          );
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [filterWaktu]);

  const handleDismissPrompt = () => setShowProfilePrompt(false);
  const handleGoToProfile = () => {
    setShowProfilePrompt(false);
    navigate("/dashboard/settings?tab=profile");
  };

  const filteredTransactions = (dashboardData?.recent_transactions || []).filter(tx => {
    const matchSearch = (tx.description || tx.desc || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "Semua" || (tx.type || "").toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchType;
  });

  const handleExportCSV = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }
    const headers = ["Tanggal", "Deskripsi", "Kategori", "Tipe", "Nominal"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(trx => [
        trx.date,
        `"${trx.description || trx.desc}"`,
        trx.category,
        trx.type,
        trx.amount
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Transaksi_Dashboard_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">
        Memuat...
      </div>
    );
  }

  const userType = profile?.user_type;
  const firstName = (
    profile?.nama_lengkap ||
    user?.user_metadata?.nama_lengkap ||
    "Pengguna"
  ).split(" ")[0];

  // ─────────────────────────────────────────────
  // TAMPILAN: PROFIL BELUM LENGKAP
  // ─────────────────────────────────────────────
  if (!userType && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          <FiUser size={28} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          Lengkapi Profil Anda
        </h2>
        <p className="text-slate-500 max-w-md">
          Silakan lengkapi profil bisnis Anda untuk mengakses dashboard.
        </p>
        <button
          onClick={() => navigate("/onboarding")}
          className="px-6 py-3 bg-[#111111] text-white rounded-xl font-bold text-sm tracking-widest hover:bg-black transition-all"
        >
          Mulai Onboarding
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // MODAL: LENGKAPI PROFIL USAHA (Premium & Minimal)
  // ─────────────────────────────────────────────
  const ProfilePromptModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={handleDismissPrompt}
      />
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-[90vw] sm:max-w-md w-full overflow-hidden"
        style={{
          animation: "modalPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <div className="p-6 sm:p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-50/50">
            <FiCheckCircle size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-3">
            {t("dashboard.first_step_success")}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
            Ide bisnis{" "}
            <span className="font-semibold text-slate-900">
              "{newBusinessName}"
            </span>{" "}
            berhasil disimpan. Lengkapi profil usaha Anda agar fitur AI dapat
            memberikan rekomendasi yang optimal.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoToProfile}
              className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-sm"
            >
              {t("dashboard.complete_profile_now")}
              <FiArrowRight size={18} />
            </button>
            <button
              onClick={handleDismissPrompt}
              className="w-full text-slate-500 hover:text-slate-800 font-semibold py-3 sm:py-3.5 text-sm transition-colors rounded-xl hover:bg-slate-50"
            >
              {t("dashboard.maybe_later")}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95) translateY(15px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );

  // ─────────────────────────────────────────────
  // TAMPILAN: CALON PENGUSAHA (PERINTIS)
  // ─────────────────────────────────────────────
  if (userType === "calon_pengusaha") {
    // ... (kode perintis tetap sama sesuai aslinya agar aman)
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fade-in">
        <div className="bg-[#0B1221] rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 opacity-20 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
              <Trans
                i18nKey="dashboard.welcome_new"
                values={{ name: firstName }}
              >
                Halo, {{ name: firstName }}! <br />
                Siap Memulai Bisnismu?
              </Trans>
            </h1>
            <p className="text-slate-300 text-lg font-medium max-w-2xl leading-relaxed mb-8">
              {t("dashboard.welcome_new_desc")}
            </p>
            <button
              onClick={() => navigate("/dashboard/recommendations")}
              className="inline-flex items-center gap-3 bg-indigo-600 text-white hover:bg-indigo-500 px-8 py-4 rounded-full font-bold text-sm tracking-widest transition-all shadow-xl shadow-indigo-600/30 active:scale-95 group"
            >
              {t("dashboard.start_business_questionnaire")}
              <FiArrowRight
                className="group-hover:translate-x-1 transition-transform"
                size={18}
              />
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <FiCpu className="text-indigo-600" size={28} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-xl mb-2">
                {t("dashboard.accurate_ai_profiling")}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t("dashboard.accurate_ai_profiling_desc")}
              </p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center shrink-0">
              <FiPieChart className="text-teal-600" size={28} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-xl mb-2">
                {t("dashboard.budget_simulation")}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t("dashboard.budget_simulation_desc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // TAMPILAN: UMKM AKTIF (Diperbarui Sesuai Referensi Gambar)
  // ─────────────────────────────────────────────
  return (
    <>
      {showProfilePrompt && <ProfilePromptModal />}

      <div className="max-w-[1400px] mx-auto space-y-6 pb-12 px-2 sm:px-6 animate-fade-in font-sans">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8 z-20 relative">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Waktu Mirip Dropdown "Month" di Gambar */}
            <div className="relative flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:border-slate-300 transition-colors shadow-sm">
              <FiCalendar className="text-slate-400 mr-2" size={14} />
              <select
                value={filterWaktu}
                onChange={(e) => setFilterWaktu(e.target.value)}
                className="appearance-none bg-transparent text-slate-600 text-sm font-medium pr-6 focus:outline-none cursor-pointer"
              >
                <option value="hari_ini">Hari Ini</option>
                <option value="minggu_ini">Minggu Ini</option>
                <option value="bulan_ini">Bulan Ini</option>
                <option value="tahun_ini">Tahun Ini</option>
              </select>
              <FiChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={14}
              />
            </div>

            {/* Quick Action Mirip Tombol "Customize" / "Run AI" */}
            <Link
              to="/dashboard/transactions"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap"
            >
              <FiPlus size={14} /> Catat Transaksi
            </Link>
          </div>
        </div>

        {apiError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 relative z-10 mb-6 font-medium">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FiX className="text-rose-500 shrink-0" size={20} />
                <p className="text-sm font-semibold text-rose-700">{apiError}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors shrink-0"
              >
                <FiActivity size={14} className="animate-spin" /> Coba Lagi
              </button>
            </div>

            {/* Tombol Aktivasi Bisnis — muncul hanya jika error terkait business_id */}
            {(apiError.toLowerCase().includes("entitas bisnis") || apiError.toLowerCase().includes("business")) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-sm font-bold text-amber-800">Akun Anda belum memiliki entitas bisnis.</p>
                  <p className="text-xs text-amber-600 mt-1">Klik tombol di samping untuk mencoba mengaktifkan bisnis secara otomatis.</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const response = await api.post("/api/profile/upgrade", {
                        nama_usaha: "Usaha Saya",
                        tipe_usaha: "Umum",
                        lama_usaha: "< 1 Tahun"
                      });
                      
                      const resData = response.data;

                      alert("✅ Bisnis berhasil diaktifkan! Halaman akan dimuat ulang.");
                      if (resData.data?.profile) {
                        localStorage.setItem("profile", JSON.stringify(resData.data.profile));
                      }
                      window.location.reload();
                    } catch (err) {
                      console.error("Gagal aktivasi bisnis:", err);
                      alert("❌ Gagal mengaktifkan bisnis: " + (err.response?.data?.message || err.message) + "\n\nSilakan hubungi rekan backend Anda untuk membuatkan business_id di database.");
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shrink-0 shadow-sm active:scale-95"
                >
                  <FiTrendingUp size={14} /> Aktivasi Bisnis
                </button>
              </div>
            )}
          </div>
        )}

        {/* METRICS CARDS (4 Kolom Layout seperti gambar) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {/* Card 1: Pemasukan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-slate-500 mb-4">
              <FiArrowUpRight size={14} />
              <span className="text-sm font-medium">
                {t("dashboard.income")}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {formatRupiah(dashboardData?.summary?.income || 0)}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-emerald-500">
                  +{dashboardData?.summary?.income_change || 0}%
                </span>
                <span className="text-xs text-slate-400">vs periode lalu</span>
              </div>
            </div>
          </div>

          {/* Card 2: Pengeluaran */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-slate-500 mb-4">
              <FiArrowDownRight size={14} />
              <span className="text-sm font-medium">
                {t("dashboard.expense")}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {formatRupiah(dashboardData?.summary?.expense || 0)}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-rose-500">
                  +{dashboardData?.summary?.expense_change || 0}%
                </span>
                <span className="text-xs text-slate-400">vs periode lalu</span>
              </div>
            </div>
          </div>

          {/* Card 3: Laba Bersih */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-slate-500 mb-4">
              <FiTrendingUp size={14} />
              <span className="text-sm font-medium">
                {t("dashboard.net_profit")}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {formatRupiah(dashboardData?.summary?.net_profit || 0)}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-emerald-500">
                  +Aktif
                </span>
                <span className="text-xs text-slate-400">profit margin</span>
              </div>
            </div>
          </div>

          {/* Card 4: Status Kesehatan (Menyesuaikan grid 4 kolom) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-slate-500 mb-4">
              <FiActivity size={14} />
              <span className="text-sm font-medium">Status Kesehatan</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">
                {dashboardData?.summary?.health_status || "Belum ada status"}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-slate-400">
                  Evaluasi sistem AI
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Charts & AI (Grid 2/3 dan 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart (Menggantikan posisi Sales Funnel) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {t("dashboard.cash_flow_trend")}
                </h3>
                <FiActivity className="text-slate-400" size={14} />
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-500">
                  <FiCalendar size={12} /> {filterWaktu.replace("_", " ")}
                </div>
              </div>
            </div>

            <div className="h-[280px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dashboardData?.chart_data || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    {/* Menggunakan warna ungu/biru menyerupai referensi chart bar */}
                    <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickFormatter={(value) => `Rp${value / 1000}k`}
                  />
                  <CartesianGrid
                    vertical={false}
                    stroke="#f8fafc"
                    strokeDasharray="3 3"
                  />
                  <RechartsTooltip
                    formatter={(value) => formatRupiah(value)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    itemStyle={{ fontWeight: "600", fontSize: "14px" }}
                    labelStyle={{
                      color: "#64748b",
                      marginBottom: "4px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorP)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorE)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Forecasting Snippet (Menggantikan posisi diagram Donut Emails) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-8">
              <h3 className="text-base font-bold text-slate-900">
                {t("dashboard.ai_prediction_title")}
              </h3>
              <FiCpu className="text-slate-400" size={14} />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center text-center">
              {/* Ornamen visual ala pie chart emails di gambar */}
              <div className="relative w-48 h-48 mb-6">
                <div className="absolute top-0 right-4 w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold opacity-80 mix-blend-multiply">
                  <span className="text-sm">Prediksi</span>
                </div>
                <div className="absolute bottom-4 left-4 w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-bold opacity-80 mix-blend-multiply">
                  <span className="text-sm">AI Arta</span>
                </div>
                <div className="absolute bottom-12 right-0 w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-400 font-bold opacity-80 mix-blend-multiply">
                  <FiTrendingUp size={20} />
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-6">
                <Trans i18nKey="dashboard.ai_prediction_desc">
                  Lihat potensi arus kas bisnis Anda di masa depan dengan model
                  AI prediktif kami.
                </Trans>
              </p>

              <Link
                to="/dashboard/forecasting"
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                {t("dashboard.view_detail")} <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Data Transaksi (Menggantikan posisi Sales Data Table) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
          <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-slate-900">
              Data Transaksi
            </h3>

            {/* Visual Action Buttons ala gambar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="relative hidden sm:block">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none flex items-center gap-2 pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 focus:outline-none cursor-pointer"
                >
                  <option value="Semua">Tipe</option>
                  <option value="Pemasukan">Pemasukan</option>
                  <option value="Pengeluaran">Pengeluaran</option>
                </select>
                <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <FiDownload size={14} />{" "}
                <span className="hidden sm:inline">Export</span>
              </button>
              <Link 
                to="/dashboard/transactions"
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm"
              >
                <FiPlus size={14} />{" "}
                <span className="hidden sm:inline">Tambah</span>
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto p-4 sm:p-6">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 px-4 text-xs font-medium text-slate-400 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      disabled
                    />
                  </th>
                  <th className="pb-3 px-4 text-xs font-medium text-slate-400">
                    Deskripsi / ID
                  </th>
                  <th className="pb-3 px-4 text-xs font-medium text-slate-400">
                    Kategori
                  </th>
                  <th className="pb-3 px-4 text-xs font-medium text-slate-400">
                    Tanggal
                  </th>
                  <th className="pb-3 px-4 text-xs font-medium text-slate-400 text-right">
                    Nominal
                  </th>
                </tr>
              </thead>
              <tbody>
                {!filteredTransactions ||
                filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-12 text-center text-slate-500 text-sm"
                    >
                      Belum ada transaksi sesuai filter. Mulai catat transaksi pertama Anda!
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, idx) => (
                    <tr
                      key={tx.id || idx}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-4 border-b border-slate-50">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          disabled
                        />
                      </td>
                      <td className="py-4 px-4 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <FiFileText size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {tx.description || tx.desc}
                            </p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              #
                              {tx.id
                                ? String(tx.id).substring(0, 6).toUpperCase()
                                : `TRX00${idx + 1}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 border-b border-slate-50">
                        <span className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 border-b border-slate-50 text-sm text-slate-500">
                        {tx.date}
                      </td>
                      <td className="py-4 px-4 border-b border-slate-50 text-right">
                        <span
                          className={`text-sm font-semibold ${(tx.type || "").toLowerCase() === "pemasukan" || tx.type === "income" ? "text-slate-900" : "text-slate-900"}`}
                        >
                          {(tx.type || "").toLowerCase() === "pemasukan" ||
                          tx.type === "income"
                            ? "+"
                            : "-"}
                          {formatRupiah(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <style>{`
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </>
  );
};

export default Dashboard;
