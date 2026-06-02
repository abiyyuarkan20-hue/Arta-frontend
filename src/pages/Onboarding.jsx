import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthProvider";
import {
  FiChevronRight,
  FiArrowLeft,
  FiCheck,
  FiSearch,
  FiChevronDown
} from "react-icons/fi";
import { supabase } from "../services/supabaseClient"; // 👈 Import Supabase ditambahkan di sini

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
    bgHex: "#FFF5EB",
    activeDot: "bg-orange-500",
  },
  {
    image: onboarding2,
    title: "Laporan Cerdas\n& Otomatis",
    desc: "Dapatkan insight keuangan melalui laporan yang dibuat otomatis dari data transaksi Anda.",
    bgHex: "#E8F5F0",
    activeDot: "bg-teal-500",
  },
  {
    image: onboarding3,
    title: "Kembangkan\nBisnis Anda",
    desc: "Dapatkan rekomendasi strategi dan peluang pertumbuhan yang dipersonalisasi untuk UMKM Anda.",
    bgHex: "#F0EAFF",
    activeDot: "bg-purple-500",
  },
];

const BUSINESS_CATEGORIES = [
  "Makanan & Minuman (F&B)",
  "Ritel & Kelontong",
  "Jasa & Servis Profesional",
  "Pakaian & Fashion",
  "Elektronik & Gadget",
  "Kesehatan & Kecantikan",
  "Otomotif",
  "Kesenian & Hiburan",
  "Pertanian & Agribisnis",
  "Pendidikan & Pelatihan",
  "Teknologi & IT",
  "Properti & Real Estate",
  "Lainnya"
];

/* ───────────────────────── component ───────────────────────── */

const Onboarding = () => {
  const navigate = useNavigate();
  const { setProfile } = useAuth();

  // phase: "intro" | "choose" | "detail"
  const [phase, setPhase] = useState("intro");
  const [slideIndex, setSlideIndex] = useState(0);

  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState({
    nama_usaha: "",
    tipe_usaha: "",
    lama_usaha: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Searchable Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = BUSINESS_CATEGORIES.filter(cat =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleSkip = () => setPhase("choose");
  const handleStart = () => setPhase("choose");

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

  const setCategory = (cat) => {
    setFormData({ ...formData, tipe_usaha: cat });
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const isFormComplete = formData.nama_usaha.trim() !== "" && formData.tipe_usaha !== "" && formData.lama_usaha !== "";

  const handleSubmitDetail = (e) => {
    e.preventDefault();
    if (!isFormComplete) return;
    submitOnboarding("umkm_aktif", formData);
  };

  // 👈 FUNGSI INI DIMODIFIKASI UNTUK AUTO-SET ROLE OWNER
  const submitOnboarding = async (user_type, extra) => {
    setLoading(true);
    setError("");
    try {
      // 1. Simpan data onboarding ke database backend
      const res = await api.post("/api/profile/onboarding", { user_type, ...extra });
      const profileData = res.data.data.profile;

      // 2. Set Auth Metadata Supabase secara diam-diam (Silent Auth Update)
      const { error: supabaseError } = await supabase.auth.updateUser({
        data: {
          role: 'OWNER',
          user_type: user_type
        }
      });

      if (supabaseError) {
        console.error("Peringatan: Gagal set role Supabase:", supabaseError.message);
      }

      // 3. Update localStorage 'user' secara sinkron agar Layout.jsx langsung membaca 'OWNER'
      const storedUserStr = localStorage.getItem("user");
      if (storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          storedUser.user_metadata = {
            ...storedUser.user_metadata,
            role: 'OWNER',
            user_type: user_type
          };
          localStorage.setItem("user", JSON.stringify(storedUser));
        } catch (e) {
          console.error("Gagal parsing local storage user", e);
        }
      }

      // 4. Lanjutkan proses seperti biasa
      localStorage.setItem("profile", JSON.stringify(profileData));
      setProfile(profileData); // Sinkronkan ke context

      // Arahkan ke dashboard/kuesioner tergantung komponen rute selanjutnya
      navigate(user_type === "calon_pengusaha" ? "/dashboard/recommendations" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  };

  const isLastSlide = slideIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[slideIndex];

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 overflow-hidden">

      {/* ────────── LEFT PANEL: ILLUSTRATION ────────── */}
      <div
        className={`w-full lg:w-1/2 h-[35vh] lg:h-screen flex items-center justify-center p-8 lg:p-20 transition-colors duration-700 ease-in-out relative select-none overflow-hidden ${phase === "detail" ? "bg-slate-900" : ""}`}
        style={phase !== "detail" ? { backgroundColor: phase === "intro" ? currentSlide.bgHex : "#FFF5EB" } : {}}
      >
        {phase !== "detail" ? (
          <>
            <div className="hidden lg:block absolute top-10 left-10 w-32 h-32 bg-white/30 rounded-full blur-2xl"></div>
            <div className="hidden lg:block absolute bottom-10 right-10 w-48 h-48 bg-black/5 rounded-full blur-3xl"></div>
            <img
              key={phase === "intro" ? currentSlide.image : onboarding1}
              src={phase === "intro" ? currentSlide.image : onboarding1}
              alt="Onboarding Illustration"
              className="h-full w-full object-contain slide-img drop-shadow-sm z-10"
              draggable={false}
            />
          </>
        ) : (
          /* Abstract Graphic for Detail Phase */
          <div className="relative w-full h-full flex items-center justify-center slide-img z-10">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-60 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-[80px] opacity-60 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-60 animate-blob animation-delay-4000"></div>

            <div className="relative z-20 text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <FiCheck className="text-white w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-white tracking-wide">Arta Bisnis</h3>
              <p className="text-indigo-200 mt-2 font-medium">Satu langkah menuju kemudahan.</p>
            </div>
          </div>
        )}
      </div>

      {/* ────────── RIGHT PANEL: CONTENT ────────── */}
      <div className="w-full lg:w-1/2 flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto flex flex-col justify-center min-h-full p-6 lg:p-16 xl:p-20">

          {/* Phase: INTRO */}
          {phase === "intro" && (
            <div className="animate-fade-in flex flex-col flex-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex-1 flex flex-col justify-center mt-4 lg:mt-0">
                <h2
                  className="text-3xl lg:text-4xl font-black text-slate-800 leading-tight mb-4 whitespace-pre-line slide-text"
                  key={`t-${slideIndex}`}
                >
                  {currentSlide.title}
                </h2>
                <p
                  className="text-base lg:text-lg text-slate-600 leading-relaxed mb-10 slide-text font-medium"
                  key={`d-${slideIndex}`}
                >
                  {currentSlide.desc}
                </p>
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
            <div className="animate-fade-in flex flex-col flex-1 justify-center bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-slate-100">
              <div className="mb-8 mt-4 lg:mt-0">
                <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-3">
                  Ceritakan Tentang Anda
                </h2>
                <p className="text-base text-slate-500 leading-relaxed">
                  Pilih yang paling menggambarkan Anda saat ini agar kami bisa menyesuaikan pengalaman Arta.
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-shake">
                  {error}
                </div>
              )}

              <div className="space-y-4 mb-10">
                <button
                  onClick={() => handleSelectType("umkm_aktif")}
                  disabled={loading}
                  className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-200 text-left active:scale-[0.98] ${selectedType === "umkm_aktif"
                    ? "border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-600/10"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${selectedType === "umkm_aktif"
                    ? "bg-indigo-600"
                    : "bg-slate-100"
                    }`}>
                    <img src={iconPengusaha} alt="Pengusaha" className="w-10 h-10 object-contain drop-shadow-sm" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-800">Saya Sudah Punya Usaha</h3>
                    <p className="text-xs lg:text-sm text-slate-500 mt-1 leading-relaxed">Kelola keuangan usaha yang sudah berjalan</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedType === "umkm_aktif" ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                    }`}>
                    {selectedType === "umkm_aktif" && <FiCheck size={14} className="text-white" strokeWidth={4} />}
                  </div>
                </button>

                <button
                  onClick={() => handleSelectType("calon_pengusaha")}
                  disabled={loading}
                  className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-200 text-left active:scale-[0.98] ${selectedType === "calon_pengusaha"
                    ? "border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-600/10"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${selectedType === "calon_pengusaha"
                    ? "bg-indigo-600"
                    : "bg-slate-100"
                    }`}>
                    <img src={iconPerintis} alt="Perintis" className="w-10 h-10 object-contain drop-shadow-sm" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-800">Saya Baru Merintis</h3>
                    <p className="text-xs lg:text-sm text-slate-500 mt-1 leading-relaxed">Belajar keuangan & cari peluang bisnis baru</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedType === "calon_pengusaha" ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                    }`}>
                    {selectedType === "calon_pengusaha" && <FiCheck size={14} className="text-white" strokeWidth={4} />}
                  </div>
                </button>
              </div>

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
            <div className="animate-fade-in flex flex-col flex-1">
              <button
                onClick={() => { setPhase("choose"); setError(""); }}
                className="text-xs font-bold tracking-widest text-slate-400 hover:text-slate-800 mb-6 flex items-center gap-2 transition-colors group self-start"
              >
                <FiArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                KEMBALI
              </button>

              <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] p-8 lg:p-10 relative overflow-hidden">
                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mb-8">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 w-full rounded-full"></div>
                  </div>
                  <span className="text-[11px] font-black tracking-widest text-indigo-600 uppercase">Langkah 2 dari 2: Profil Usaha</span>
                </div>

                <div className="mb-8">
                  <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-3">Detail Usaha</h2>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Lengkapi profil agar kami bisa menyiapkan dashboard terbaik untuk Anda.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-shake">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmitDetail} className="space-y-6">
                  {/* Nama Usaha */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase">Nama Usaha / Toko</label>
                    <input
                      type="text"
                      name="nama_usaha"
                      value={formData.nama_usaha}
                      onChange={handleInputChange}
                      placeholder="Contoh: Kedai Kopi Senja"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all text-base font-bold text-slate-800 placeholder:font-normal placeholder:text-slate-400"
                      required
                    />
                  </div>

                  {/* Kategori Usaha (Searchable Dropdown) */}
                  <div className="space-y-2 relative" ref={dropdownRef}>
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase">Kategori Usaha</label>
                    <div
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all"
                      onClick={() => setIsDropdownOpen(true)}
                    >
                      {isDropdownOpen ? (
                        <div className="flex items-center gap-3 w-full">
                          <FiSearch className="text-slate-400 flex-shrink-0" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Cari kategori... (cth: Kuliner)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-base font-bold text-slate-800 placeholder:font-normal placeholder:text-slate-400"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-base ${formData.tipe_usaha ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                            {formData.tipe_usaha || "Pilih Kategori Usaha"}
                          </span>
                          <FiChevronDown className="text-slate-400" />
                        </div>
                      )}
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.1)] rounded-2xl max-h-60 overflow-y-auto custom-scrollbar p-2">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCategory(cat)}
                              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-between"
                            >
                              {cat}
                              {formData.tipe_usaha === cat && <FiCheck className="text-indigo-600" />}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-4 text-sm text-slate-500 text-center">
                            Kategori tidak ditemukan
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lama Usaha Berjalan */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase">Lama Usaha Berjalan</label>
                    <div className="flex flex-wrap gap-3">
                      {['< 1 Tahun', '1 - 3 Tahun', '> 3 Tahun'].map((duration) => (
                        <button
                          key={duration}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, lama_usaha: duration });
                            setError("");
                          }}
                          className={`px-5 py-3 rounded-full border-2 transition-all duration-200 text-sm font-bold active:scale-95 ${formData.lama_usaha === duration
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          {duration}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-8">
                    <button
                      type="submit"
                      disabled={loading || !isFormComplete}
                      className={`w-full font-bold tracking-widest text-sm py-4 rounded-full shadow-xl transition-all active:scale-[0.97] flex justify-center items-center gap-2 group ${isFormComplete
                        ? 'bg-[#111111] hover:bg-black text-white shadow-black/10'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                    >
                      {loading ? (
                        <span className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Menyiapkan Dashboard...
                        </span>
                      ) : (
                        "SELESAI"
                      )}
                    </button>
                  </div>
                </form>
              </div>
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
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;