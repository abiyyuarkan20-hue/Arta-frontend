import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import api from "../services/api";
import { 
  FiTrendingUp, FiArrowUpRight, FiArrowDownRight, FiPieChart, 
  FiActivity, FiArrowRight, FiCpu, FiCheckCircle, FiX, FiUser,
  FiMapPin, FiPhone, FiFileText
} from "react-icons/fi";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

const cashFlowData = [
  { date: "01 Mei", Pemasukan: 1200000, Pengeluaran: 400000 },
  { date: "05 Mei", Pemasukan: 1500000, Pengeluaran: 600000 },
  { date: "10 Mei", Pemasukan: 2100000, Pengeluaran: 800000 },
  { date: "15 Mei", Pemasukan: 1800000, Pengeluaran: 1200000 },
  { date: "20 Mei", Pemasukan: 3000000, Pengeluaran: 1000000 },
  { date: "25 Mei", Pemasukan: 3500000, Pengeluaran: 1500000 },
];

const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number || 0);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    
    const storedProfile = localStorage.getItem("profile");
    if (storedProfile) setProfile(JSON.parse(storedProfile));

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
    
    setLoading(false);
  }, []);

  const handleDismissPrompt = () => setShowProfilePrompt(false);
  const handleGoToProfile = () => {
    setShowProfilePrompt(false);
    navigate("/dashboard/settings?tab=profile");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">Memuat...</div>;
  }

  const userType = profile?.user_type || "calon_pengusaha";
  const firstName = (profile?.nama_lengkap || user?.user_metadata?.nama_lengkap || "Pengguna").split(" ")[0];

  // ─────────────────────────────────────────────
  // MODAL: LENGKAPI PROFIL USAHA (Premium & Minimal)
  // ─────────────────────────────────────────────
  const ProfilePromptModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={handleDismissPrompt} 
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden"
        style={{ animation: "modalPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        {/* Decorative Top Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 opacity-100" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={handleDismissPrompt} 
          className="absolute top-4 right-4 text-white hover:text-white/80 bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all z-10 backdrop-blur-sm"
        >
          <FiX size={20} strokeWidth={3} />
        </button>

        {/* Content */}
        <div className="relative p-8 pt-10 text-center">
          {/* Icon Header */}
          <div className="mx-auto w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 transform -rotate-3 hover:rotate-0 transition-transform relative z-10 -mt-20 border-4 border-white">
            <FiCheckCircle size={40} className="text-emerald-500" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-3">
            {t('dashboard.first_step_success')}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed px-2 mb-8">
            Ide <span className="font-bold text-indigo-600">"{newBusinessName}"</span> Anda sudah kami simpan. Mari lengkapi profil usaha agar fitur AI bekerja optimal.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={handleGoToProfile}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 text-sm group"
            >
              {t('dashboard.complete_profile_now')}
              <FiArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleDismissPrompt}
              className="w-full text-slate-400 hover:text-slate-600 font-bold py-3 text-sm transition-colors rounded-xl hover:bg-slate-50"
            >
              {t('dashboard.maybe_later')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );

  // ─────────────────────────────────────────────
  // TAMPILAN: CALON PENGUSAHA (PERINTIS)
  // ─────────────────────────────────────────────
  if (userType === "calon_pengusaha") {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fade-in">
        <div className="bg-[#0B1221] rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 opacity-20 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 text-white rounded-2xl mb-6 shadow-sm border border-white/10 backdrop-blur-md">
              <span className="text-3xl">🚀</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight"><Trans i18nKey="dashboard.welcome_new" values={{ name: firstName }}>Halo, {{name: firstName}}! <br/>Siap Memulai Bisnismu?</Trans></h1>
            <p className="text-slate-300 text-lg font-medium max-w-2xl leading-relaxed mb-8">
              {t('dashboard.welcome_new_desc')}
            </p>
            <button 
              onClick={() => navigate('/dashboard/recommendations')}
              className="inline-flex items-center gap-3 bg-indigo-600 text-white hover:bg-indigo-500 px-8 py-4 rounded-full font-bold text-sm tracking-widest transition-all shadow-xl shadow-indigo-600/30 active:scale-95 group"
            >
              {t('dashboard.start_business_questionnaire')}
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <FiCpu className="text-indigo-600" size={28} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-xl mb-2">{t('dashboard.accurate_ai_profiling')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t('dashboard.accurate_ai_profiling_desc')}
              </p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center shrink-0">
              <FiPieChart className="text-teal-600" size={28} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-xl mb-2">{t('dashboard.budget_simulation')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t('dashboard.budget_simulation_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // TAMPILAN: UMKM AKTIF
  // ─────────────────────────────────────────────
  return (
    <>
      {showProfilePrompt && <ProfilePromptModal />}

      <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{t("dashboard.business_overview")}</h1>
            <p className="text-slate-500 font-medium mt-1">{t("dashboard.welcome_message", { name: firstName })}</p>
          </div>
          <Link 
            to="/dashboard/transactions"
            className="px-6 py-3 bg-[#111111] text-white rounded-xl text-sm font-bold tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-95"
          >
            + {t("dashboard.record_new_transaction")}
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2 relative z-10">{t("dashboard.income_this_month")}</p>
            <h3 className="text-3xl font-black text-slate-800 mb-4 relative z-10">{formatRupiah(13100000)}</h3>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 w-fit px-3 py-1.5 rounded-lg relative z-10">
              <FiArrowUpRight size={14} /> 12% dari bulan lalu
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2 relative z-10">{t("dashboard.expense_this_month")}</p>
            <h3 className="text-3xl font-black text-slate-800 mb-4 relative z-10">{formatRupiah(5500000)}</h3>
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 w-fit px-3 py-1.5 rounded-lg relative z-10">
              <FiArrowDownRight size={14} /> 3% dari bulan lalu
            </div>
          </div>

          <div className="bg-[#0B1221] p-8 rounded-[2rem] shadow-2xl relative overflow-hidden text-white">
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500 opacity-20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2 relative z-10">{t("dashboard.net_profit")}</p>
            <h3 className="text-3xl font-black mb-4 relative z-10 text-white">{formatRupiah(7600000)}</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-400/20 w-fit px-3 py-1.5 rounded-lg relative z-10">
              <FiActivity size={14} /> {t("dashboard.status_healthy")}
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-800">{t('dashboard.cash_flow_trend')}</h3>
              <p className="text-sm font-medium text-slate-400">{t('dashboard.cash_flow_trend_desc')}</p>
            </div>
            <Link to="/dashboard/reports" className="text-xs font-bold tracking-widest uppercase text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2 bg-indigo-50 px-4 py-2.5 rounded-xl border border-indigo-100">
              {t('dashboard.view_reports')} <FiArrowRight />
            </Link>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickFormatter={(value) => `Rp ${value/1000}k`} />
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <RechartsTooltip 
                  formatter={(value) => formatRupiah(value)}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  labelStyle={{ color: '#64748b', marginBottom: '8px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorP)" />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorE)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <style>{`
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </>
  );
};

export default Dashboard;
