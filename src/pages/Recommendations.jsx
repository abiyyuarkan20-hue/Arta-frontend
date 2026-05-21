import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  FiArrowRight, FiArrowLeft, FiCpu, FiStar, FiBriefcase, FiShield,
  FiPieChart, FiInfo, FiDollarSign, FiMapPin, FiUser, FiSliders
} from "react-icons/fi";
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number || 0);
};

const SEKTOR_OPTIONS = [
  { id: "F&B", label: "Makanan & Minuman (F&B)" },
  { id: "Retail", label: "Ritel & Kelontong" },
  { id: "Jasa", label: "Jasa & Layanan" },
  { id: "Tech", label: "Teknologi & Digital" },
];

const LOKASI_OPTIONS = [
  { id: "Kampus", label: "Area Kampus / Sekolah" },
  { id: "Perumahan", label: "Kawasan Perumahan" },
  { id: "Kota", label: "Pusat Kota / Komersial" }
];

const PASAR_OPTIONS = [
  { id: "Mahasiswa", label: "Pelajar / Mahasiswa" },
  { id: "Karyawan", label: "Pekerja / Karyawan" },
  { id: "IRT", label: "Ibu Rumah Tangga (IRT)" }
];

const PENDIDIKAN_OPTIONS = [
  { id: "SMA", label: "SMA / Sederajat" },
  { id: "Diploma", label: "Diploma (D1-D4)" },
  { id: "Sarjana", label: "Sarjana (S1+)" }
];

const KEAHLIAN_OPTIONS = [
  { id: "Memasak", label: "Memasak / Kuliner" },
  { id: "Desain", label: "Desain / Kreatif" },
  { id: "IT", label: "Pemrograman / IT" },
  { id: "Pemasaran", label: "Pemasaran / Sales" },
  { id: "Manajemen", label: "Manajemen / Administrasi" },
  { id: "Lainnya", label: "Keahlian Lainnya" }
];

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#f43f5e'];

const generateMockAIRecommendations = (data) => {
  const modal = parseInt(data.modal_awal.replace(/[^0-9]/g, "")) || 5000000;
  const pAlat = parseInt(data.alokasi_alat_bahan) / 100;
  const pPemasaran = parseInt(data.alokasi_pemasaran) / 100;
  
  const capex = modal * pAlat; 
  const pemasaran = modal * pPemasaran;
  const opex = modal - (capex + pemasaran); // sisa untuk operasional
  
  let recs = [];
  
  if (data.sektor_bisnis === "F&B") {
    recs = [
      { id: 1, name: "Kedai Kopi Susu Kekinian", type: "Makanan & Minuman", match: 94, capexDesc: "Mesin Espresso Basic, Booth, Bahan Baku Awal", opexDesc: "Gaji Barista, Sewa Tempat, Biaya Pemasaran" },
      { id: 2, name: "Katering Makanan Sehat", type: "Makanan & Minuman", match: 88, capexDesc: "Peralatan Dapur, Packaging, Bahan Baku", opexDesc: "Bahan Makanan Harian, Kurir, Marketing Ads" }
    ];
  } else if (data.sektor_bisnis === "Jasa") {
    recs = [
      { id: 1, name: "Jasa Cuci Sepatu Premium", type: "Jasa & Servis", match: 96, capexDesc: "Peralatan Cuci, Bahan Pembersih, Branding", opexDesc: "Biaya Air/Listrik, Operasional Harian" },
      { id: 2, name: "Jasa Kebersihan (Cleaning Service)", type: "Jasa & Servis", match: 85, capexDesc: "Peralatan Kebersihan Industrial", opexDesc: "Transportasi, Bahan Kimia Pembersih" }
    ];
  } else if (data.sektor_bisnis === "Tech") {
    recs = [
      { id: 1, name: "Jasa Digital Marketing", type: "Teknologi & Digital", match: 92, capexDesc: "Laptop, Software Ads, Setup Website", opexDesc: "Langganan Tool, Internet, Iklan Mandiri" },
      { id: 2, name: "Software House Mini", type: "Teknologi & Digital", match: 89, capexDesc: "Server Lokal, Lisensi Software", opexDesc: "Cloud Hosting, Gaji Freelancer" }
    ];
  } else {
    recs = [
      { id: 1, name: "Toko Kelontong Modern / Minimarket Mini", type: "Ritel & Kelontong", match: 95, capexDesc: "Stok Barang Awal, Rak, Aplikasi Kasir", opexDesc: "Listrik, Sewa, Gaji Pegawai" },
      { id: 2, name: "Thrift Shop Fashion", type: "Ritel & Kelontong", match: 89, capexDesc: "Bal Pakaian Bekas, Hanger, Steamer", opexDesc: "Kuota Internet, Packing, Iklan Medsos" }
    ];
  }

  return {
    allocations: [
      { name: 'Alat & Bahan', value: capex },
      { name: 'Pemasaran', value: pemasaran },
      { name: 'Operasional Lainnya', value: opex < 0 ? 0 : opex },
    ],
    ideas: recs
  };
};

const Recommendations = () => {
  const navigate = useNavigate();
  
  // Phase 2: Form, Phase 3: Loading, Phase 4: Results
  const [perintisPhase, setPerintisPhase] = useState(2); 
  
  // Sesuai 10 variabel dataset
  const [wizardData, setWizardData] = useState({
    modal_awal: "",
    alokasi_alat_bahan: "50",
    alokasi_pemasaran: "15",
    target_roi_bulan: "6",
    sektor_bisnis: "",
    lokasi_strategis: "",
    target_pasar: "",
    pendidikan_terakhir: "",
    keahlian_teknis: "",
    pengalaman_usaha: "" // "0" atau "1"
  });

  const [aiResults, setAiResults] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleWizardInput = (key, val) => {
    setWizardData(prev => ({ ...prev, [key]: val }));
    if (errorMsg) setErrorMsg("");
  };

  const handleModalInput = (e) => {
    let val = e.target.value.replace(/[^,\d]/g, '');
    if (val) {
      val = parseInt(val).toLocaleString('id-ID');
    }
    handleWizardInput("modal_awal", val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validasi 10 kolom
    const {
      modal_awal, alokasi_alat_bahan, alokasi_pemasaran, target_roi_bulan,
      sektor_bisnis, lokasi_strategis, target_pasar,
      pendidikan_terakhir, keahlian_teknis, pengalaman_usaha
    } = wizardData;

    if (!modal_awal || !alokasi_alat_bahan || !alokasi_pemasaran || !target_roi_bulan ||
        !sektor_bisnis || !lokasi_strategis || !target_pasar ||
        !pendidikan_terakhir || !keahlian_teknis || pengalaman_usaha === "") {
      setErrorMsg("Mohon lengkapi seluruh (10) pertanyaan kuesioner sebelum melanjutkan.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPerintisPhase(3); // AI Loading
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => {
      const results = generateMockAIRecommendations(wizardData);
      setAiResults(results);
      setPerintisPhase(4); // Results
    }, 4500);
  };

  const handleStartBusiness = async (idea) => {
    setIsUpgrading(true);
    try {
      const res = await api.post("/api/profile/onboarding", { 
        user_type: "umkm_aktif", 
        nama_usaha: idea.name,
        tipe_usaha: idea.type
      });
      localStorage.setItem("profile", JSON.stringify(res.data.data.profile));
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan. Silakan coba lagi.");
      setIsUpgrading(false);
    }
  };

  // PHASE 2: NORMAL FORM (10 VARIABEL)
  if (perintisPhase === 2) {
    return (
      <div className="max-w-4xl mx-auto pb-16 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate("/dashboard")}
            className="text-slate-400 hover:text-slate-800 transition-colors p-2 -ml-2"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Kuesioner Kelayakan Bisnis</h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">Lengkapi data di bawah agar model Prediksi Kelayakan Artha AI dapat bekerja akurat.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl mb-6 flex items-center gap-3 font-bold text-sm shadow-sm">
            <FiInfo size={18} /> {errorMsg}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION A: FINANSIAL & TARGET */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <FiDollarSign className="text-indigo-600" /> A. Informasi Finansial & Target
            </h2>
            
            <div className="space-y-8">
              {/* 1. Modal Awal */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">1. Modal Awal <span className="text-red-500">*</span></label>
                <p className="text-sm text-slate-500 mb-3">Dana segar yang siap Anda investasikan saat ini.</p>
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium">Rp</span>
                  </div>
                  <input 
                    type="text" 
                    value={wizardData.modal_awal}
                    onChange={handleModalInput}
                    placeholder="Contoh: 10.000.000"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 2. Alokasi Alat & Bahan */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block font-bold text-slate-800">2. Alokasi Alat & Bahan <span className="text-red-500">*</span></label>
                    <span className="font-black text-indigo-600 text-lg">{wizardData.alokasi_alat_bahan}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">Berapa persen dari modal untuk membeli aset tetap/produksi awal?</p>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={wizardData.alokasi_alat_bahan}
                    onChange={(e) => handleWizardInput("alokasi_alat_bahan", e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* 3. Alokasi Pemasaran */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block font-bold text-slate-800">3. Alokasi Pemasaran <span className="text-red-500">*</span></label>
                    <span className="font-black text-indigo-600 text-lg">{wizardData.alokasi_pemasaran}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">Persentase modal untuk marketing/akuisisi pelanggan di awal.</p>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={wizardData.alokasi_pemasaran}
                    onChange={(e) => handleWizardInput("alokasi_pemasaran", e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              {/* 4. Target ROI */}
              <div>
                 <div className="flex justify-between items-end mb-2 max-w-md">
                    <label className="block font-bold text-slate-800">4. Target Balik Modal (ROI) <span className="text-red-500">*</span></label>
                    <span className="font-black text-indigo-600 text-lg">{wizardData.target_roi_bulan} Bulan</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 max-w-md">Ekspektasi Anda, dalam berapa bulan bisnis ini bisa balik modal?</p>
                  <input 
                    type="range" 
                    min="1" max="24" 
                    value={wizardData.target_roi_bulan}
                    onChange={(e) => handleWizardInput("target_roi_bulan", e.target.value)}
                    className="w-full max-w-md h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
              </div>
            </div>
          </div>

          {/* SECTION B: RENCANA BISNIS */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <FiMapPin className="text-indigo-600" /> B. Detail Rencana Bisnis
            </h2>
            
            <div className="space-y-8">
              {/* 5. Sektor Bisnis */}
              <div>
                <label className="block font-bold text-slate-800 mb-3">5. Sektor Bisnis <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SEKTOR_OPTIONS.map(opt => (
                    <label key={opt.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${wizardData.sektor_bisnis === opt.id ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name="sektor_bisnis" 
                        value={opt.id} 
                        checked={wizardData.sektor_bisnis === opt.id}
                        onChange={() => handleWizardInput("sektor_bisnis", opt.id)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <span className={`ml-3 text-sm font-medium ${wizardData.sektor_bisnis === opt.id ? 'text-indigo-700' : 'text-slate-700'}`}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 6. Lokasi Strategis */}
                <div>
                  <label className="block font-bold text-slate-800 mb-3">6. Lokasi Strategis Utama <span className="text-red-500">*</span></label>
                  <div className="space-y-3">
                    {LOKASI_OPTIONS.map(opt => (
                      <label key={opt.id} className="flex items-center cursor-pointer">
                        <input 
                          type="radio" 
                          name="lokasi_strategis" 
                          value={opt.id} 
                          checked={wizardData.lokasi_strategis === opt.id}
                          onChange={() => handleWizardInput("lokasi_strategis", opt.id)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-sm text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* 7. Target Pasar */}
                <div>
                  <label className="block font-bold text-slate-800 mb-3">7. Target Pasar Konsumen <span className="text-red-500">*</span></label>
                  <div className="space-y-3">
                    {PASAR_OPTIONS.map(opt => (
                      <label key={opt.id} className="flex items-center cursor-pointer">
                        <input 
                          type="radio" 
                          name="target_pasar" 
                          value={opt.id} 
                          checked={wizardData.target_pasar === opt.id}
                          onChange={() => handleWizardInput("target_pasar", opt.id)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-sm text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION C: PROFIL */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <FiUser className="text-indigo-600" /> C. Profil & Latar Belakang
            </h2>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 8. Pendidikan Terakhir */}
                <div>
                  <label className="block font-bold text-slate-800 mb-2">8. Pendidikan Terakhir <span className="text-red-500">*</span></label>
                  <select 
                    value={wizardData.pendidikan_terakhir} 
                    onChange={(e) => handleWizardInput("pendidikan_terakhir", e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800"
                  >
                    <option value="" disabled>Pilih Pendidikan</option>
                    {PENDIDIKAN_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  </select>
                </div>

                {/* 9. Keahlian Teknis */}
                <div>
                  <label className="block font-bold text-slate-800 mb-2">9. Keahlian Teknis (Dominan) <span className="text-red-500">*</span></label>
                  <select 
                    value={wizardData.keahlian_teknis} 
                    onChange={(e) => handleWizardInput("keahlian_teknis", e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800"
                  >
                    <option value="" disabled>Pilih Keahlian Utama</option>
                    {KEAHLIAN_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              {/* 10. Pengalaman Usaha */}
              <div>
                <label className="block font-bold text-slate-800 mb-3">10. Pengalaman Usaha Sebelumnya <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  <label className={`flex items-center p-3 px-6 rounded-lg border cursor-pointer transition-colors ${wizardData.pengalaman_usaha === "0" ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="pengalaman_usaha" 
                      value="0" 
                      checked={wizardData.pengalaman_usaha === "0"}
                      onChange={() => handleWizardInput("pengalaman_usaha", "0")}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className={`ml-3 text-sm font-medium ${wizardData.pengalaman_usaha === "0" ? 'text-indigo-700' : 'text-slate-700'}`}>0 (Tidak Pernah)</span>
                  </label>
                  <label className={`flex items-center p-3 px-6 rounded-lg border cursor-pointer transition-colors ${wizardData.pengalaman_usaha === "1" ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="pengalaman_usaha" 
                      value="1" 
                      checked={wizardData.pengalaman_usaha === "1"}
                      onChange={() => handleWizardInput("pengalaman_usaha", "1")}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className={`ml-3 text-sm font-medium ${wizardData.pengalaman_usaha === "1" ? 'text-indigo-700' : 'text-slate-700'}`}>1 (Ya, Pernah)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              className="bg-[#111111] hover:bg-black text-white font-bold text-sm tracking-widest px-8 py-4 rounded-xl shadow-xl shadow-black/10 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <FiCpu size={20} className="text-indigo-400" />
              PREDIKSI KELAYAKAN
            </button>
          </div>
        </form>
      </div>
    );
  }

  // PHASE 3: AI LOADING
  if (perintisPhase === 3) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center relative z-10 rotate-3 animate-[spin_4s_linear_infinite]">
            <FiCpu size={40} className="text-white -rotate-3" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-3 text-center">
          Menganalisis 10 Parameter Dataset...
        </h2>
        <p className="text-slate-500 text-center max-w-sm">
          Menghitung rasio alokasi, membandingkan ROI, dan memprediksi persentase kelayakan bisnis.
        </p>
      </div>
    );
  }

  // PHASE 4: RESULTS & CTA
  if (perintisPhase === 4 && aiResults) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black tracking-widest uppercase mb-4 border border-indigo-100">
            <FiStar className="mr-2" /> Analisis Selesai
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">Rekomendasi Bisnis Cerdas</h1>
          <p className="text-slate-500 text-lg">Berdasarkan perhitungan model klasifikasi, berikut prediksi ide bisnis yang layak untuk profil Anda.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Col: Ideas */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <FiBriefcase className="text-indigo-600" /> Ide Bisnis Pilihan AI
            </h3>
            
            {aiResults.ideas.map((idea, idx) => (
              <div key={idea.id} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 relative overflow-hidden group hover:border-indigo-300 transition-colors">
                {idx === 0 && (
                   <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-xs font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-sm">
                     Top Match
                   </div>
                )}
                <div className="flex items-start justify-between mb-4 mt-2">
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 mb-1">{idea.name}</h4>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{idea.type}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-3xl font-black text-emerald-600">{idea.match}%</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelayakan</div>
                  </div>
                </div>
                
                <hr className="my-6 border-slate-100" />
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Rekomendasi CAPEX</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{idea.capexDesc}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Rekomendasi OPEX</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{idea.opexDesc}</p>
                  </div>
                </div>

                <button 
                  disabled={isUpgrading}
                  onClick={() => handleStartBusiness(idea)}
                  className="w-full bg-[#111111] hover:bg-black text-white py-4 rounded-xl font-bold tracking-widest text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md disabled:opacity-70"
                >
                  {isUpgrading ? "MEMPROSES..." : "MULAI RENCANA BISNIS INI"} <FiArrowRight />
                </button>
              </div>
            ))}
          </div>

          {/* Right Col: Budget Simulation */}
          <div className="lg:pl-8">
            <div className="bg-[#0B1221] rounded-3xl p-8 md:p-10 text-white shadow-xl sticky top-8">
              <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                <FiPieChart className="text-teal-400" /> Simulasi Anggaran Otomatis
              </h3>
              <p className="text-slate-400 text-sm font-medium mb-8">
                Distribusi rasio berdasarkan alokasi slider Anda (Total: Rp {wizardData.modal_awal})
              </p>

              <div className="h-64 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={aiResults.allocations}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {aiResults.allocations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => formatRupiah(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: 'white' }}
                      itemStyle={{ color: 'white', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {aiResults.allocations.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                      <span className="font-bold text-sm">{item.name}</span>
                    </div>
                    <span className="font-black tracking-wide">{formatRupiah(item.value)}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-start gap-3">
                <FiShield className="text-indigo-400 mt-0.5 shrink-0" size={18} />
                <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                  Menyisihkan sisa persentase untuk OPEX sejak awal akan menahan *burn-rate* keuangan sebelum bisnis menembus target ROI di bulan ke-{wizardData.target_roi_bulan}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null;
};

export default Recommendations;
