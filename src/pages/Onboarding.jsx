import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  FiChevronRight,
  FiArrowLeft,
  FiCheck,
  FiShoppingBag,
  FiCoffee,
  FiTool,
  FiShoppingCart,
  FiMoreHorizontal,
} from "react-icons/fi";

import onboarding1 from "../assets/onboarding-1.png";
import onboarding2 from "../assets/onboarding-2.png";
import onboarding3 from "../assets/onboarding-3.png";
import iconPengusaha from "../assets/icons/pengusaha.png";
import iconPerintis from "../assets/icons/perintis.png";

/* ───────────────────────── data ───────────────────────── */

const SLIDES = [
  {
    image: onboarding1,
    title: "Catat Keuangan\nUsaha Anda",
    desc: "Kelola pemasukan dan pengeluaran bisnis Anda dengan mudah dan terorganisir setiap hari.",
    bgHex: "#FFF5EB", // Matching the first generated image background
    activeDot: "bg-orange-500",
  },
  {
    image: onboarding2,
    title: "Laporan Cerdas\n& Otomatis",
    desc: "Dapatkan insight keuangan melalui laporan yang dibuat otomatis dari data transaksi Anda.",
    bgHex: "#E8F5F0", // Matching the second generated image background
    activeDot: "bg-teal-500",
  },
  {
    image: onboarding3,
    title: "Kembangkan\nBisnis Anda",
    desc: "Dapatkan rekomendasi strategi dan peluang pertumbuhan yang dipersonalisasi untuk UMKM Anda.",
    bgHex: "#F0EAFF", // Matching the third generated image background
    activeDot: "bg-purple-500",
  },
];

const BUSINESS_TYPES = [
  { value: "Makanan & Minuman", label: "F&B", icon: FiCoffee, color: "orange" },
  { value: "Ritel & Kelontong", label: "Ritel", icon: FiShoppingCart, color: "blue" },
  { value: "Jasa & Servis", label: "Jasa", icon: FiTool, color: "emerald" },
  { value: "Pakaian & Fashion", label: "Fashion", icon: FiShoppingBag, color: "purple" },
  { value: "Lainnya", label: "Lainnya", icon: FiMoreHorizontal, color: "slate" },
];

/* ───────────────────────── component ───────────────────────── */

const Onboarding = () => {
  const navigate = useNavigate();

  // phase: "intro" | "choose" | "detail"
  const [phase, setPhase] = useState("intro");
  const [slideIndex, setSlideIndex] = useState(0);

  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState({ nama_usaha: "", tipe_usaha: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ── slide navigation ── */
  const goNext = useCallback(() => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex((i) => i + 1);
    }
  }, [slideIndex]);

  const goPrev = useCallback(() => {
    if (slideIndex > 0) {
      setSlideIndex((i) => i - 1);
    }
  }, [slideIndex]);

  const handleSkip = () => {
    setPhase("choose");
  };

  const handleStart = () => {
    setPhase("choose");
  };

  /* ── keyboard support ── */
  useEffect(() => {
    if (phase !== "intro") return;
    const handler = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, goNext, goPrev]);

  /* ── touch/swipe support ── */
  const [touchStart, setTouchStart] = useState(null);
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  };

  /* ── business logic ── */
  const handleSelectType = (type) => {
    setSelectedType(type);
    setError("");
  };

  const handleContinueType = () => {
    if (!selectedType) { setError("Pilih salah satu untuk melanjutkan."); return; }
    if (selectedType === "calon_pengusaha") {
      submitOnboarding("calon_pengusaha", {});
    } else {
      setPhase("detail");
      setError("");
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSelectBusiness = (v) => {
    setFormData({ ...formData, tipe_usaha: v });
    setError("");
  };

  const handleSubmitDetail = (e) => {
    e.preventDefault();
    if (!formData.nama_usaha.trim()) { setError("Masukkan nama usaha Anda."); return; }
    if (!formData.tipe_usaha) { setError("Pilih bidang usaha Anda."); return; }
    submitOnboarding("umkm_aktif", formData);
  };

  const submitOnboarding = async (user_type, extra) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/profile/onboarding", { user_type, ...extra });
      localStorage.setItem("profile", JSON.stringify(res.data.data.profile));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  };

  const isLastSlide = slideIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[slideIndex];

  // For phase 'choose' and 'detail', we'll just keep the first illustration as the left banner
  const activeImage = phase === "intro" ? currentSlide.image : onboarding1;
  const activeBgHex = phase === "intro" ? currentSlide.bgHex : "#FFF5EB";

  const colorMap = {
    orange: { sel: "border-orange-400 bg-orange-50", icon: "bg-orange-100 text-orange-600", dot: "bg-orange-500" },
    blue: { sel: "border-blue-400 bg-blue-50", icon: "bg-blue-100 text-blue-600", dot: "bg-blue-500" },
    emerald: { sel: "border-emerald-400 bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-500" },
    purple: { sel: "border-purple-400 bg-purple-50", icon: "bg-purple-100 text-purple-600", dot: "bg-purple-500" },
    slate: { sel: "border-slate-300 bg-slate-50", icon: "bg-slate-100 text-slate-600", dot: "bg-slate-500" },
  };

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden">

      {/* ────────── LEFT PANEL: ILLUSTRATION ────────── */}
      <div
        className="w-full lg:w-1/2 h-[45vh] lg:h-screen flex items-center justify-center p-8 lg:p-20 transition-colors duration-700 ease-in-out relative select-none"
        style={{ backgroundColor: activeBgHex }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Subtle decorative circles for added flair on desktop */}
        <div className="hidden lg:block absolute top-10 left-10 w-32 h-32 bg-white/30 rounded-full blur-2xl"></div>
        <div className="hidden lg:block absolute bottom-10 right-10 w-48 h-48 bg-black/5 rounded-full blur-3xl"></div>

        <img
          key={activeImage} // force re-render for animation on change
          src={activeImage}
          alt="Onboarding Illustration"
          className="h-full w-full object-contain slide-img drop-shadow-sm z-10"
          draggable={false}
        />
      </div>

      {/* ────────── RIGHT PANEL: CONTENT ────────── */}
      <div className="w-full lg:w-1/2 flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="w-full max-w-lg mx-auto flex flex-col justify-center min-h-full p-8 lg:p-16 xl:p-20">

          {/* Phase: INTRO */}
          {phase === "intro" && (
            <div className="animate-fade-in flex flex-col flex-1">
              <div className="flex-1 flex flex-col justify-center mt-4 lg:mt-0">
                {/* Title */}
                <h2
                  className="text-3xl lg:text-4xl font-black text-slate-800 leading-tight mb-4 whitespace-pre-line slide-text"
                  key={`t-${slideIndex}`}
                >
                  {currentSlide.title}
                </h2>

                {/* Description */}
                <p
                  className="text-base lg:text-lg text-slate-600 leading-relaxed mb-10 slide-text font-medium"
                  key={`d-${slideIndex}`}
                >
                  {currentSlide.desc}
                </p>

                {/* Dots */}
                <div className="flex items-center gap-3 mb-12">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIndex(i)}
                      className={`rounded-full transition-all duration-300 ease-in-out ${i === slideIndex
                        ? `w-10 h-3 ${currentSlide.activeDot}`
                        : "w-3 h-3 bg-slate-200 hover:bg-slate-300"
                        }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons Area */}
              <div className="flex items-center justify-between w-full mt-auto pt-8">
                <button
                  onClick={handleSkip}
                  className={`text-sm font-bold tracking-widest text-slate-500 hover:text-slate-900 transition-colors py-3 pr-6 ${isLastSlide ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  LEWATI
                </button>

                <button
                  onClick={isLastSlide ? handleStart : goNext}
                  className="bg-[#111111] hover:bg-black text-white font-bold text-sm tracking-wider px-10 py-4 rounded-full shadow-xl shadow-black/10 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                >
                  {isLastSlide ? "MULAI SEKARANG" : "LANJUT"}
                  {!isLastSlide && <FiChevronRight size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Phase: CHOOSE TYPE */}
          {phase === "choose" && (
            <div className="animate-fade-in flex flex-col flex-1 justify-center">
              {/* Header */}
              <div className="mb-8 mt-4 lg:mt-0">
                <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-3">
                  Ceritakan Tentang Anda
                </h2>
                <p className="text-base text-slate-500 leading-relaxed">
                  Pilih yang paling menggambarkan Anda saat ini agar kami bisa menyesuaikan pengalaman Artha.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-shake">
                  {error}
                </div>
              )}

              {/* Options */}
              <div className="space-y-4 mb-10">
                <button
                  onClick={() => handleSelectType("umkm_aktif")}
                  disabled={loading}
                  className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-200 text-left active:scale-[0.98] ${selectedType === "umkm_aktif"
                    ? "border-black bg-slate-50 shadow-md shadow-black/5"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${selectedType === "umkm_aktif"
                    ? "bg-slate-800"
                    : "bg-slate-100"
                    }`}>
                    <img src={iconPengusaha} alt="Pengusaha" className="w-10 h-10 object-contain drop-shadow-sm" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-800">Saya Sudah Punya Usaha</h3>
                    <p className="text-xs lg:text-sm text-slate-500 mt-1 leading-relaxed">Kelola keuangan usaha yang sudah berjalan</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedType === "umkm_aktif" ? "border-black bg-black" : "border-slate-300"
                    }`}>
                    {selectedType === "umkm_aktif" && <FiCheck size={14} className="text-white" strokeWidth={4} />}
                  </div>
                </button>

                <button
                  onClick={() => handleSelectType("calon_pengusaha")}
                  disabled={loading}
                  className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-200 text-left active:scale-[0.98] ${selectedType === "calon_pengusaha"
                    ? "border-black bg-slate-50 shadow-md shadow-black/5"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${selectedType === "calon_pengusaha"
                    ? "bg-slate-800"
                    : "bg-slate-100"
                    }`}>
                    <img src={iconPerintis} alt="Perintis" className="w-10 h-10 object-contain drop-shadow-sm" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-800">Saya Baru Merintis</h3>
                    <p className="text-xs lg:text-sm text-slate-500 mt-1 leading-relaxed">Belajar keuangan & cari peluang bisnis baru</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedType === "calon_pengusaha" ? "border-black bg-black" : "border-slate-300"
                    }`}>
                    {selectedType === "calon_pengusaha" && <FiCheck size={14} className="text-white" strokeWidth={4} />}
                  </div>
                </button>
              </div>

              {/* Continue */}
              <div className="mt-auto">
                <button
                  onClick={handleContinueType}
                  disabled={loading || !selectedType}
                  className={`w-full font-bold py-4 rounded-full shadow-xl transition-all active:scale-[0.97] flex justify-center items-center gap-2 tracking-widest text-sm ${selectedType
                    ? "bg-[#111111] hover:bg-black text-white shadow-black/10"
                    : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      MEMPROSES...
                    </span>
                  ) : (
                    "LANJUTKAN"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Phase: BUSINESS DETAIL */}
          {phase === "detail" && (
            <div className="animate-fade-in flex flex-col flex-1 justify-center">
              {/* Back */}
              <button
                onClick={() => { setPhase("choose"); setError(""); }}
                className="text-xs font-bold tracking-widest text-slate-400 hover:text-black mb-8 flex items-center gap-2 transition-colors group self-start"
              >
                <FiArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                KEMBALI
              </button>

              {/* Header */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 text-slate-800 rounded-full mb-6 border border-slate-100 shadow-sm">
                  <span className="text-3xl">🏢</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-3">Detail Usaha Anda</h2>
                <p className="text-base text-slate-500 leading-relaxed">
                  Bantu kami menyusun laporan dan rekomendasi yang paling pas untuk bisnis Anda.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-shake">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmitDetail} className="flex-1 flex flex-col">
                <div className="space-y-8 flex-1">
                  {/* Nama Usaha */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase">Nama Usaha / Toko</label>
                    <input
                      type="text"
                      name="nama_usaha"
                      value={formData.nama_usaha}
                      onChange={handleInputChange}
                      placeholder="Contoh: Kedai Kopi Senja"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-black/5 focus:border-black focus:bg-white outline-none transition-all text-base font-medium placeholder:font-normal placeholder:text-slate-400"
                      required
                    />
                  </div>

                  {/* Bidang Usaha */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase">Bidang Usaha</label>
                    <div className="flex flex-wrap gap-3">
                      {BUSINESS_TYPES.map((t) => {
                        const Icon = t.icon;
                        const c = colorMap[t.color];
                        const active = formData.tipe_usaha === t.value;
                        return (
                          <button
                            type="button"
                            key={t.value}
                            onClick={() => handleSelectBusiness(t.value)}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-full border-2 transition-all duration-200 active:scale-[0.96] text-sm font-bold ${active
                              ? `border-black bg-black text-white shadow-lg shadow-black/10`
                              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                          >
                            <Icon size={16} className={active ? "text-white" : "text-slate-400"} />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-10 mt-auto">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#111111] hover:bg-black text-white font-bold tracking-widest text-sm py-4 rounded-full shadow-xl shadow-black/10 transition-all active:scale-[0.97] flex justify-center items-center gap-2 group"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        MENYIMPAN...
                      </span>
                    ) : (
                      "MULAI SEKARANG"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer */}
          {phase !== "intro" && (
            <p className="text-center text-xs font-medium text-slate-400 mt-8 animate-fade-in">
              Anda bisa mengubah informasi ini kapan saja di pengaturan.
            </p>
          )}

        </div>
      </div>

      {/* ────────── Animations ────────── */}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-img {
          animation: slideImgIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .slide-text {
          animation: slideTextIn 0.5s ease-out forwards;
        }
        @keyframes slideImgIn {
          from { opacity: 0; transform: scale(0.92) translateY(15px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideTextIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
