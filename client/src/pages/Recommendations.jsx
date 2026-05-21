import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  FiArrowRight, FiArrowLeft, FiCpu, FiStar, FiBriefcase, FiShield,
  FiPieChart, FiInfo, FiDollarSign, FiMapPin, FiUser, FiSliders,
  FiCoffee, FiShoppingBag, FiTool, FiMonitor, FiCheckCircle,
  FiBookOpen, FiHome, FiUsers, FiMinus, FiPlus
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
  { id: "Jasa", label: "Jasa & Layanan Umum" },
  { id: "Tech", label: "Teknologi & Digital" },
  { id: "Fashion", label: "Fashion & Pakaian" },
  { id: "Agribisnis", label: "Agribisnis & Pertanian" },
  { id: "Kesehatan", label: "Kesehatan & Kecantikan" },
  { id: "Pendidikan", label: "Pendidikan & Pelatihan" },
  { id: "Otomotif", label: "Otomotif & Transportasi" },
  { id: "Manufaktur", label: "Manufaktur & Kerajinan" },
  { id: "Properti", label: "Properti & Konstruksi" },
  { id: "Hiburan", label: "Event & Hiburan" }
];

const LOKASI_OPTIONS = [
  { id: "Kampus", label: "Area Kampus / Sekolah" },
  { id: "Perumahan", label: "Kawasan Perumahan" },
  { id: "Kota", label: "Pusat Kota / Komersial" },
  { id: "Mall", label: "Mall / Pusat Perbelanjaan" },
  { id: "JalanRaya", label: "Pinggir Jalan Raya Utama" },
  { id: "Perkantoran", label: "Kawasan Industri / Perkantoran" },
  { id: "Transportasi", label: "Stasiun / Terminal / Bandara" },
  { id: "Wisata", label: "Tempat Wisata" },
  { id: "Pasar", label: "Pasar Tradisional" },
  { id: "Online", label: "Online / Tanpa Toko Fisik" }
];

const PASAR_OPTIONS = [
  { id: "Mahasiswa", label: "Pelajar / Mahasiswa" },
  { id: "Karyawan", label: "Pekerja / Karyawan" },
  { id: "IRT", label: "Ibu Rumah Tangga (IRT)" },
  { id: "Anak", label: "Anak-anak" },
  { id: "Remaja", label: "Remaja" },
  { id: "Dewasa", label: "Dewasa Muda" },
  { id: "Lansia", label: "Orang Tua / Lansia" },
  { id: "Keluarga", label: "Keluarga" },
  { id: "Wisatawan", label: "Wisatawan / Turis" },
  { id: "B2B", label: "Perusahaan / B2B" }
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
  const opex = modal - (capex + pemasaran); 
  
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

const CustomStepper = ({ label, value, onChange, min, max, unit, description, colorClass, presets, step = 1 }) => {
  const numValue = parseInt(value) || 0;

  const handleDecrease = () => {
    if (numValue - step >= min) onChange(String(numValue - step));
    else onChange(String(min));
  };

  const handleIncrease = () => {
    if (numValue + step <= max) onChange(String(numValue + step));
    else onChange(String(max));
  };

  const isIndigo = colorClass.includes('indigo');

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col h-full">
      <div className="mb-6">
        <label className="block font-bold text-slate-800 text-base">{label} <span className="text-red-500">*</span></label>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      
      <div className="mt-auto">
        <div className="flex items-center justify-between bg-white border-2 border-slate-200 rounded-xl p-2 mb-4 shadow-sm">
          <button 
            type="button"
            onClick={handleDecrease}
            className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors focus:outline-none active:scale-95"
          >
            <FiMinus size={20} />
          </button>
          
          <div className="flex-1 text-center font-black text-2xl text-slate-800">
            {value}<span className="text-lg text-slate-500 ml-1">{unit}</span>
          </div>
          
          <button 
            type="button"
            onClick={handleIncrease}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors focus:outline-none active:scale-95 ${isIndigo ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
          >
            <FiPlus size={20} />
          </button>
        </div>

        {presets && presets.length > 0 && (
          <div className="flex gap-2">
            {presets.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => onChange(String(p))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors active:scale-95
                  ${numValue === p ? (isIndigo ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-emerald-600 text-white border-emerald-600 shadow-md') : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                {p}{unit}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ChoiceCard = ({ label, selected, onClick, icon: Icon }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 text-center h-full group
      ${selected ? 'border-indigo-600 bg-indigo-50 shadow-md scale-[1.02]' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 hover:-translate-y-0.5'}`}
  >
    {Icon && <Icon className={`text-3xl transition-colors ${selected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-400'}`} />}
    <span className={`font-bold text-sm transition-colors ${selected ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-800'}`}>{label}</span>
  </div>
);

const Recommendations = () => {
  const navigate = useNavigate();
  const [perintisPhase, setPerintisPhase] = useState(2); 
  
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
    pengalaman_usaha: "0" 
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
    
    const {
      modal_awal, alokasi_alat_bahan, alokasi_pemasaran, target_roi_bulan,
      sektor_bisnis, lokasi_strategis, target_pasar,
      pendidikan_terakhir, keahlian_teknis, pengalaman_usaha
    } = wizardData;

    if (!modal_awal || !alokasi_alat_bahan || !alokasi_pemasaran || !target_roi_bulan ||
        !sektor_bisnis || !lokasi_strategis || !target_pasar ||
        !pendidikan_terakhir || !keahlian_teknis || pengalaman_usaha === "") {
      setErrorMsg("Mohon lengkapi seluruh pertanyaan kuesioner sebelum melanjutkan.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPerintisPhase(3); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => {
      const results = generateMockAIRecommendations(wizardData);
      setAiResults(results);
      setPerintisPhase(4); 
    }, 3000);
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

  if (perintisPhase === 2) {
    return (
      <div className="max-w-4xl mx-auto pb-20 animate-fade-in mt-4">
        
        {/* Header */}
        <div className="flex items-start gap-4 mb-10">
          <button 
            onClick={() => navigate("/dashboard")}
            className="text-slate-400 hover:text-slate-800 transition-colors p-2 -ml-2 bg-white rounded-full shadow-sm border border-slate-100 hover:shadow-md"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Kuesioner Kelayakan Bisnis</h1>
            <p className="text-slate-500 mt-2 text-lg">Lengkapi data di bawah agar model Prediksi Kelayakan Artha AI dapat bekerja secara akurat.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 font-bold text-sm shadow-sm animate-pulse-once">
            <FiInfo size={20} className="shrink-0" /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION A: FINANSIAL & TARGET */}
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
            
            <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4 relative z-10">
              <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl"><FiDollarSign size={22} /></div>
              A. Informasi Finansial & Target
            </h2>
            
            <div className="space-y-8 relative z-10">
              {/* 1. Modal Awal */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="block font-bold text-slate-800 mb-2 text-base">1. Modal Awal <span className="text-red-500">*</span></label>
                <p className="text-slate-500 mb-4 text-sm">Dana segar yang siap Anda investasikan saat ini.</p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-bold text-lg">Rp</span>
                  </div>
                  <input 
                    type="text" 
                    value={wizardData.modal_awal}
                    onChange={handleModalInput}
                    placeholder="Contoh: 10.000.000"
                    className="w-full pl-14 pr-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <CustomStepper 
                  label="2. Alat & Bahan"
                  value={wizardData.alokasi_alat_bahan}
                  onChange={(val) => handleWizardInput("alokasi_alat_bahan", val)}
                  min={0} max={100} step={5} unit="%"
                  description="Porsi modal untuk aset tetap/produksi awal."
                  colorClass="text-indigo-700 bg-indigo-100"
                  presets={[25, 50, 75]}
                />
                
                <CustomStepper 
                  label="3. Pemasaran"
                  value={wizardData.alokasi_pemasaran}
                  onChange={(val) => handleWizardInput("alokasi_pemasaran", val)}
                  min={0} max={100} step={5} unit="%"
                  description="Porsi modal untuk promosi/marketing awal."
                  colorClass="text-indigo-700 bg-indigo-100"
                  presets={[10, 15, 25]}
                />
              </div>

              <CustomStepper 
                label="4. Target Balik Modal (ROI)"
                value={wizardData.target_roi_bulan}
                onChange={(val) => handleWizardInput("target_roi_bulan", val)}
                min={1} max={24} step={1} unit=" Bln"
                description="Ekspektasi waktu agar modal awal Anda kembali sepenuhnya."
                colorClass="text-emerald-700 bg-emerald-100"
                presets={[6, 12, 18, 24]}
              />
            </div>
          </div>

          {/* SECTION B: RENCANA BISNIS */}
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
            
            <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4 relative z-10">
              <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl"><FiMapPin size={22} /></div>
              B. Detail Rencana Bisnis
            </h2>
            
            <div className="space-y-6 relative z-10">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="block font-bold text-slate-800 mb-3 text-base">5. Sektor Bisnis <span className="text-red-500">*</span></label>
                <select 
                  value={wizardData.sektor_bisnis} 
                  onChange={(e) => handleWizardInput("sektor_bisnis", e.target.value)}
                  className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 cursor-pointer appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                >
                  <option value="" disabled>Pilih Sektor Bisnis Anda</option>
                  {SEKTOR_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="block font-bold text-slate-800 mb-3 text-base">6. Lokasi Strategis Utama <span className="text-red-500">*</span></label>
                <select 
                  value={wizardData.lokasi_strategis} 
                  onChange={(e) => handleWizardInput("lokasi_strategis", e.target.value)}
                  className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 cursor-pointer appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                >
                  <option value="" disabled>Pilih Rencana Lokasi Anda</option>
                  {LOKASI_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="block font-bold text-slate-800 mb-3 text-base">7. Target Pasar Konsumen <span className="text-red-500">*</span></label>
                <select 
                  value={wizardData.target_pasar} 
                  onChange={(e) => handleWizardInput("target_pasar", e.target.value)}
                  className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 cursor-pointer appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                >
                  <option value="" disabled>Pilih Target Pasar Utama Anda</option>
                  {PASAR_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION C: PROFIL */}
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
            
            <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4 relative z-10">
              <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl"><FiUser size={22} /></div>
              C. Profil & Latar Belakang
            </h2>
            
            <div className="space-y-6 relative z-10">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <label className="block font-bold text-slate-800 mb-3 text-base">8. Pendidikan Terakhir <span className="text-red-500">*</span></label>
                  <select 
                    value={wizardData.pendidikan_terakhir} 
                    onChange={(e) => handleWizardInput("pendidikan_terakhir", e.target.value)}
                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold text-slate-700 cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                  >
                    <option value="" disabled>Pilih Pendidikan</option>
                    {PENDIDIKAN_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  </select>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <label className="block font-bold text-slate-800 mb-3 text-base">9. Keahlian Teknis <span className="text-red-500">*</span></label>
                  <select 
                    value={wizardData.keahlian_teknis} 
                    onChange={(e) => handleWizardInput("keahlian_teknis", e.target.value)}
                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold text-slate-700 cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                  >
                    <option value="" disabled>Pilih Keahlian Utama</option>
                    {KEAHLIAN_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="block font-bold text-slate-800 mb-4 text-base">10. Pengalaman Usaha Sebelumnya <span className="text-red-500">*</span></label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className={`flex-1 flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${wizardData.pengalaman_usaha === "0" ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-amber-300'}`}>
                    <input 
                      type="radio" name="pengalaman_usaha" value="0" 
                      checked={wizardData.pengalaman_usaha === "0"}
                      onChange={() => handleWizardInput("pengalaman_usaha", "0")}
                      className="w-5 h-5 text-amber-600 border-slate-300 focus:ring-amber-500"
                    />
                    <span className={`ml-3 font-bold ${wizardData.pengalaman_usaha === "0" ? 'text-amber-700' : 'text-slate-600'}`}>Belum Pernah Punya Bisnis</span>
                  </label>
                  
                  <label className={`flex-1 flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${wizardData.pengalaman_usaha === "1" ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-amber-300'}`}>
                    <input 
                      type="radio" name="pengalaman_usaha" value="1" 
                      checked={wizardData.pengalaman_usaha === "1"}
                      onChange={() => handleWizardInput("pengalaman_usaha", "1")}
                      className="w-5 h-5 text-amber-600 border-slate-300 focus:ring-amber-500"
                    />
                    <span className={`ml-3 font-bold ${wizardData.pengalaman_usaha === "1" ? 'text-amber-700' : 'text-slate-600'}`}>Ya, Sudah Pernah / Sedang</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 pb-10">
            <button 
              type="submit"
              className="bg-[#111111] hover:bg-black text-white font-bold text-sm tracking-widest px-10 py-5 rounded-2xl shadow-xl shadow-black/10 transition-all flex items-center justify-center gap-3 active:scale-95 hover:-translate-y-1 w-full md:w-auto"
            >
              <FiCpu size={22} className="text-indigo-400" />
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
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center relative z-10 rotate-3 animate-[spin_4s_linear_infinite]">
            <FiCpu size={48} className="text-white -rotate-3" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4 text-center tracking-tight">
          Menganalisis Parameter...
        </h2>
        <p className="text-slate-500 text-center max-w-sm text-lg leading-relaxed">
          Menghitung rasio alokasi, membandingkan ROI, dan memprediksi persentase kelayakan bisnis.
        </p>
      </div>
    );
  }

  // PHASE 4: RESULTS & CTA
  if (perintisPhase === 4 && aiResults) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in mt-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black tracking-widest uppercase mb-4 border border-indigo-100">
            <FiStar className="mr-2" /> Analisis Selesai
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">Rekomendasi Bisnis</h1>
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
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Kelayakan</div>
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
                <FiPieChart className="text-teal-400" /> Simulasi Anggaran
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
