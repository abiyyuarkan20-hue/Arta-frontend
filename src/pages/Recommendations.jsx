import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import api from "../services/api";
import { 
  FiArrowRight, FiArrowLeft, FiCpu, FiStar, FiBriefcase, FiShield,
  FiPieChart, FiInfo, FiDollarSign, FiMapPin, FiUser, FiMinus, FiPlus,
  FiHeart, FiDownload, FiRefreshCcw, FiAlertTriangle, FiTrendingUp,
  FiActivity, FiCheckCircle, FiClock, FiBarChart2, FiZap, FiTarget, FiX
} from "react-icons/fi";
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
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

const PIE_COLORS = ['#4f46e5', '#f59e0b', '#10b981'];

const getRiskConfig = (level) => {
  if (level === "Rendah") return { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" };
  if (level === "Menengah") return { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" };
  return { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" };
};

const getDifficultyConfig = (level) => {
  if (level === "Pemula") return { color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" };
  if (level === "Menengah") return { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" };
  return { color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" };
};

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
      {
        id: 1, name: "Kedai Kopi Susu Kekinian", type: "Makanan & Minuman", match: 94,
        capexDesc: "Mesin Espresso Basic, Booth, Bahan Baku Awal",
        opexDesc: "Gaji Barista, Sewa Tempat, Biaya Pemasaran",
        riskLevel: "Menengah", difficulty: "Pemula",
        riskDescription: "Risiko utama adalah tingginya persaingan di segmen kopi kekinian dan perubahan tren konsumen yang cepat. Bahan baku seperti susu dan kopi memiliki harga yang fluktuatif.",
        growthPotential: "Sangat tinggi. Model bisnis ini mudah direplikasi dan berpotensi dikembangkan menjadi cabang atau sistem franchise dalam 1-2 tahun.",
        successTips: ["Ciptakan signature drink eksklusif", "Manfaatkan TikTok & Instagram secara konsisten", "Jaga kualitas bahan baku & layanan pelanggan"],
        radarData: [
          { subject: "Kelayakan", A: 94 }, { subject: "Skalabilitas", A: 80 },
          { subject: "Ketahanan", A: 65 }, { subject: "Mudah Dijalankan", A: 85 }, { subject: "Potensi Profit", A: 78 },
        ]
      },
      {
        id: 2, name: "Katering Makanan Sehat", type: "Makanan & Minuman", match: 88,
        capexDesc: "Peralatan Dapur, Packaging, Bahan Baku",
        opexDesc: "Bahan Makanan Harian, Kurir, Marketing Ads",
        riskLevel: "Rendah", difficulty: "Menengah",
        riskDescription: "Risiko utama ada pada operasional logistik dan konsistensi kualitas rasa. Kehilangan satu klien korporat bisa berdampak signifikan pada pendapatan bulanan.",
        growthPotential: "Tinggi, terutama dengan mengincar klien korporat (B2B). Satu kontrak perusahaan bisa langsung meningkatkan omset 5-10x lipat.",
        successTips: ["Bidik niche pasar yang spesifik (diet keto, vegan, dsb.)", "Bangun sistem langganan (subscription) mingguan/bulanan", "Prioritaskan kualitas packaging yang menarik"],
        radarData: [
          { subject: "Kelayakan", A: 88 }, { subject: "Skalabilitas", A: 72 },
          { subject: "Ketahanan", A: 80 }, { subject: "Mudah Dijalankan", A: 60 }, { subject: "Potensi Profit", A: 85 },
        ]
      }
    ];
  } else if (data.sektor_bisnis === "Tech") {
    recs = [
      {
        id: 1, name: "Jasa Digital Marketing", type: "Teknologi & Digital", match: 92,
        capexDesc: "Laptop, Software Ads, Setup Website",
        opexDesc: "Langganan Tool, Internet, Iklan Mandiri",
        riskLevel: "Rendah", difficulty: "Menengah",
        riskDescription: "Risiko utama ada pada retensi klien. Kehilangan satu klien besar bisa memotong 30-50% pendapatan bulanan. Keberhasilan sangat bergantung pada kemampuan membuktikan ROI ke klien.",
        growthPotential: "Sangat tinggi. Bisnis ini dapat diskalakan secara digital tanpa batas geografis. Berpotensi berkembang menjadi agensi penuh dengan tim remote.",
        successTips: ["Tampilkan portofolio berbasis data (CTR, ROAS, konversi)", "Spesialisasi di satu industri dulu (misal: F&B atau properti)", "Tawarkan paket retainer bulanan untuk pendapatan yang stabil"],
        radarData: [
          { subject: "Kelayakan", A: 92 }, { subject: "Skalabilitas", A: 95 },
          { subject: "Ketahanan", A: 70 }, { subject: "Mudah Dijalankan", A: 65 }, { subject: "Potensi Profit", A: 90 },
        ]
      },
      {
        id: 2, name: "Software House Mini", type: "Teknologi & Digital", match: 89,
        capexDesc: "Server Lokal, Lisensi Software",
        opexDesc: "Cloud Hosting, Gaji Freelancer",
        riskLevel: "Menengah", difficulty: "Lanjut",
        riskDescription: "Risiko utama adalah sulitnya menemukan developer yang handal dengan anggaran terbatas dan tingginya ekspektasi klien terhadap tenggat waktu proyek.",
        growthPotential: "Sangat tinggi jika berhasil membangun reputasi. Satu proyek enterprise bisa senilai ratusan juta rupiah dan membuka pintu ke proyek-proyek berikutnya.",
        successTips: ["Mulai dengan proyek kecil untuk membangun reputasi", "Gunakan platform freelance (Fiverr, Upwork) untuk proyek pertama", "Investasikan di dokumentasi & after-sales support"],
        radarData: [
          { subject: "Kelayakan", A: 89 }, { subject: "Skalabilitas", A: 88 },
          { subject: "Ketahanan", A: 72 }, { subject: "Mudah Dijalankan", A: 45 }, { subject: "Potensi Profit", A: 92 },
        ]
      }
    ];
  } else if (data.sektor_bisnis === "Jasa") {
    recs = [
      {
        id: 1, name: "Jasa Cuci Sepatu Premium", type: "Jasa & Servis", match: 96,
        capexDesc: "Peralatan Cuci, Bahan Pembersih, Branding",
        opexDesc: "Biaya Air/Listrik, Operasional Harian",
        riskLevel: "Rendah", difficulty: "Pemula",
        riskDescription: "Risiko utama adalah kerusakan produk pelanggan yang bernilai tinggi (sepatu limited edition) jika tidak ditangani dengan benar. Perlindungan asuransi barang sangat disarankan.",
        growthPotential: "Tinggi. Model bisnis mudah direplikasi. Bisa dikembangkan ke layanan perawatan tas, topi, dan aksesori fashion lainnya.",
        successTips: ["Dokumentasikan proses cuci dengan video sebelum & sesudah", "Tawarkan paket langganan bulanan", "Bangun komunitas sneakers untuk loyalitas pelanggan"],
        radarData: [
          { subject: "Kelayakan", A: 96 }, { subject: "Skalabilitas", A: 75 },
          { subject: "Ketahanan", A: 85 }, { subject: "Mudah Dijalankan", A: 90 }, { subject: "Potensi Profit", A: 70 },
        ]
      },
      {
        id: 2, name: "Jasa Kebersihan (Cleaning Service)", type: "Jasa & Servis", match: 85,
        capexDesc: "Peralatan Kebersihan Industrial",
        opexDesc: "Transportasi, Bahan Kimia Pembersih",
        riskLevel: "Rendah", difficulty: "Pemula",
        riskDescription: "Risiko utama adalah kepercayaan klien kepada pekerja yang masuk ke properti pribadi. Proses seleksi tim yang ketat dan surat perjanjian profesional sangat diperlukan.",
        growthPotential: "Sangat tinggi dengan target korporat. Satu kontrak gedung perkantoran bisa menghasilkan pendapatan rutin bulanan yang sangat signifikan.",
        successTips: ["Daftarkan bisnis dan miliki izin usaha untuk meningkatkan kepercayaan", "Latih tim dengan standar kebersihan yang terukur", "Pasarkan melalui aplikasi seperti Gojek/Grab Home Services"],
        radarData: [
          { subject: "Kelayakan", A: 85 }, { subject: "Skalabilitas", A: 80 },
          { subject: "Ketahanan", A: 88 }, { subject: "Mudah Dijalankan", A: 82 }, { subject: "Potensi Profit", A: 72 },
        ]
      }
    ];
  } else {
    recs = [
      {
        id: 1, name: "Toko Kelontong Modern / Minimarket Mini", type: "Ritel & Kelontong", match: 95,
        capexDesc: "Stok Barang Awal, Rak, Aplikasi Kasir",
        opexDesc: "Listrik, Sewa, Gaji Pegawai",
        riskLevel: "Rendah", difficulty: "Pemula",
        riskDescription: "Risiko utama adalah margin keuntungan yang tipis per item dan persaingan ketat dengan minimarket jaringan besar. Keberhasilan bergantung pada lokasi dan harga yang kompetitif.",
        growthPotential: "Stabil dan dapat diprediksi. Berpotensi berkembang dengan menambahkan layanan bayar tagihan (PPOB) untuk menambah sumber pendapatan.",
        successTips: ["Pilih lokasi perumahan yang belum ada minimarket jaringan besar", "Tawarkan layanan pesan-antar ke whatsapp untuk pelanggan setia", "Manfaatkan sistem Point of Sale (POS) untuk melacak stok"],
        radarData: [
          { subject: "Kelayakan", A: 95 }, { subject: "Skalabilitas", A: 60 },
          { subject: "Ketahanan", A: 90 }, { subject: "Mudah Dijalankan", A: 88 }, { subject: "Potensi Profit", A: 65 },
        ]
      },
      {
        id: 2, name: "Thrift Shop Fashion", type: "Ritel & Kelontong", match: 89,
        capexDesc: "Bal Pakaian Bekas, Hanger, Steamer",
        opexDesc: "Kuota Internet, Packing, Iklan Medsos",
        riskLevel: "Menengah", difficulty: "Pemula",
        riskDescription: "Risiko utama adalah ketidakpastian kualitas isi 'bal' (grosir pakaian bekas). Pemilih yang kurang teliti bisa membuat modal terbuang untuk stok yang sulit terjual.",
        growthPotential: "Sangat tinggi di kalangan generasi muda. Tren fashion berkelanjutan (sustainable fashion) menjadi angin segar. Potensial membuka toko online yang sangat aktif.",
        successTips: ["Pelajari cara membaca kualitas bal sebelum membeli", "Bangun personal branding yang kuat di TikTok dan Instagram", "Lakukan sesi 'live selling' secara rutin untuk meningkatkan penjualan"],
        radarData: [
          { subject: "Kelayakan", A: 89 }, { subject: "Skalabilitas", A: 82 },
          { subject: "Ketahanan", A: 68 }, { subject: "Mudah Dijalankan", A: 85 }, { subject: "Potensi Profit", A: 75 },
        ]
      }
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
  const handleDecrease = () => onChange(String(Math.max(min, numValue - step)));
  const handleIncrease = () => onChange(String(Math.min(max, numValue + step)));
  const isIndigo = colorClass.includes('indigo');
  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col h-full">
      <div className="mb-6">
        <label className="block font-bold text-slate-800 text-base">{label} <span className="text-red-500">*</span></label>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <div className="mt-auto">
        <div className="flex items-center justify-between bg-white border-2 border-slate-200 rounded-xl p-2 mb-4 shadow-sm">
          <button type="button" onClick={handleDecrease} className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95"><FiMinus size={20} /></button>
          <div className="flex-1 text-center font-black text-2xl text-slate-800">{value}<span className="text-lg text-slate-500 ml-1">{unit}</span></div>
          <button type="button" onClick={handleIncrease} className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors active:scale-95 ${isIndigo ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}><FiPlus size={20} /></button>
        </div>
        {presets && (
          <div className="flex gap-2">
            {presets.map(p => (
              <button key={p} type="button" onClick={() => onChange(String(p))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors active:scale-95
                  ${numValue === p ? (isIndigo ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-emerald-600 text-white border-emerald-600 shadow-md') : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
              >{p}{unit}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SelectField = ({ label, value, onChange, options, placeholder, accentColor = "emerald" }) => (
  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
    <label className="block font-bold text-slate-800 mb-3 text-base">{label} <span className="text-red-500">*</span></label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={`w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-${accentColor}-500/10 focus:border-${accentColor}-500 outline-none transition-all font-bold text-slate-700 cursor-pointer appearance-none`}
      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
    </select>
  </div>
);

const Recommendations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [perintisPhase, setPerintisPhase] = useState(2);
  const [wizardData, setWizardData] = useState({
    modal_awal: "", alokasi_alat_bahan: "50", alokasi_pemasaran: "15",
    target_roi_bulan: "6", sektor_bisnis: "", lokasi_strategis: "",
    target_pasar: "", pendidikan_terakhir: "", keahlian_teknis: "", pengalaman_usaha: "0"
  });
  const [aiResults, setAiResults] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [expandedIdea, setExpandedIdea] = useState(null);

  const handleWizardInput = (key, val) => { setWizardData(p => ({ ...p, [key]: val })); if (errorMsg) setErrorMsg(""); };
  const handleModalInput = (e) => {
    let val = e.target.value.replace(/[^,\d]/g, '');
    if (val) val = parseInt(val).toLocaleString('id-ID');
    handleWizardInput("modal_awal", val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { modal_awal, alokasi_alat_bahan, alokasi_pemasaran, target_roi_bulan, sektor_bisnis, lokasi_strategis, target_pasar, pendidikan_terakhir, keahlian_teknis, pengalaman_usaha } = wizardData;
    if (!modal_awal || !alokasi_alat_bahan || !alokasi_pemasaran || !target_roi_bulan || !sektor_bisnis || !lokasi_strategis || !target_pasar || !pendidikan_terakhir || !keahlian_teknis || pengalaman_usaha === "") {
      setErrorMsg(t('recommendations.fill_all_warning')); window.scrollTo({ top: 0, behavior: 'smooth' }); return;
    }
    setPerintisPhase(3); window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { setAiResults(generateMockAIRecommendations(wizardData)); setPerintisPhase(4); }, 3000);
  };

  const handleStartBusiness = async (idea) => {
    setIsUpgrading(true);
    try {
      const res = await api.post("/api/profile/onboarding", { user_type: "umkm_aktif", nama_usaha: idea.name, tipe_usaha: idea.type });
      localStorage.setItem("profile", JSON.stringify(res.data.data.profile));
      // Flag: minta user lengkapi profil usaha setelah masuk dashboard
      localStorage.setItem("show_profile_prompt", "true");
      localStorage.setItem("new_business_name", idea.name);
      window.location.href = "/dashboard";
    } catch (err) { console.error(err); alert("Terjadi kesalahan. Silakan coba lagi."); setIsUpgrading(false); }
  };

  const modalAwalNum = parseInt(wizardData.modal_awal.replace(/[^0-9]/g, "")) || 0;
  const targetBulanNum = parseInt(wizardData.target_roi_bulan) || 1;
  const targetProfitBulanan = modalAwalNum / targetBulanNum;

  /* ───── FASE 2: FORMULIR ───── */
  if (perintisPhase === 2) {
    return (
      <div className="max-w-4xl mx-auto pb-20 animate-fade-in mt-4">
        <div className="flex items-start gap-4 mb-10">
          <button onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-slate-800 transition-colors p-2 -ml-2 bg-white rounded-full shadow-sm border border-slate-100 hover:shadow-md"><FiArrowLeft size={24} /></button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">{t('recommendations.questionnaire_title')}</h1>
            <p className="text-slate-500 mt-2 text-lg">{t('recommendations.questionnaire_desc')}</p>
          </div>
        </div>
        {errorMsg && <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 font-bold text-sm shadow-sm"><FiInfo size={20} className="shrink-0" /> {errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION A */}
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
            <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4 relative z-10"><div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl"><FiDollarSign size={22} /></div>{t('recommendations.section_a')}</h2>
            <div className="space-y-8 relative z-10">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="block font-bold text-slate-800 mb-2 text-base">{t('recommendations.q1_label')} <span className="text-red-500">*</span></label>
                <p className="text-slate-500 mb-4 text-sm">{t('recommendations.q1_desc')}</p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><span className="text-slate-500 font-bold text-lg">Rp</span></div>
                  <input type="text" value={wizardData.modal_awal} onChange={handleModalInput} placeholder={t('recommendations.q1_placeholder')} className="w-full pl-14 pr-5 py-4 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xl text-slate-800" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <CustomStepper label={t('recommendations.q2_label')} value={wizardData.alokasi_alat_bahan} onChange={(v) => handleWizardInput("alokasi_alat_bahan", v)} min={0} max={100} step={5} unit="%" description={t('recommendations.q2_desc')} colorClass="text-indigo-700 bg-indigo-100" presets={[25, 50, 75]} />
                <CustomStepper label={t('recommendations.q3_label')} value={wizardData.alokasi_pemasaran} onChange={(v) => handleWizardInput("alokasi_pemasaran", v)} min={0} max={100} step={5} unit="%" description={t('recommendations.q3_desc')} colorClass="text-indigo-700 bg-indigo-100" presets={[10, 15, 25]} />
              </div>
              <CustomStepper label={t('recommendations.q4_label')} value={wizardData.target_roi_bulan} onChange={(v) => handleWizardInput("target_roi_bulan", v)} min={1} max={24} step={1} unit=" Bln" description={t('recommendations.q4_desc')} colorClass="text-emerald-700 bg-emerald-100" presets={[6, 12, 18, 24]} />
            </div>
          </div>
          {/* SECTION B */}
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
            <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4 relative z-10"><div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl"><FiMapPin size={22} /></div>{t('recommendations.section_b')}</h2>
            <div className="space-y-6 relative z-10">
              <SelectField label={t('recommendations.q5_label')} value={wizardData.sektor_bisnis} onChange={(v) => handleWizardInput("sektor_bisnis", v)} options={SEKTOR_OPTIONS} placeholder={t('recommendations.q5_placeholder')} />
              <SelectField label={t('recommendations.q6_label')} value={wizardData.lokasi_strategis} onChange={(v) => handleWizardInput("lokasi_strategis", v)} options={LOKASI_OPTIONS} placeholder={t('recommendations.q6_placeholder')} />
              <SelectField label={t('recommendations.q7_label')} value={wizardData.target_pasar} onChange={(v) => handleWizardInput("target_pasar", v)} options={PASAR_OPTIONS} placeholder={t('recommendations.q7_placeholder')} />
            </div>
          </div>
          {/* SECTION C */}
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
            <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4 relative z-10"><div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl"><FiUser size={22} /></div>{t('recommendations.section_c')}</h2>
            <div className="space-y-6 relative z-10">
              <div className="grid md:grid-cols-2 gap-6">
                <SelectField label={t('recommendations.q8_label')} value={wizardData.pendidikan_terakhir} onChange={(v) => handleWizardInput("pendidikan_terakhir", v)} options={PENDIDIKAN_OPTIONS} placeholder={t('recommendations.q8_placeholder')} accentColor="amber" />
                <SelectField label={t('recommendations.q9_label')} value={wizardData.keahlian_teknis} onChange={(v) => handleWizardInput("keahlian_teknis", v)} options={KEAHLIAN_OPTIONS} placeholder={t('recommendations.q9_placeholder')} accentColor="amber" />
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="block font-bold text-slate-800 mb-4 text-base">{t('recommendations.q10_label')} <span className="text-red-500">*</span></label>
                <div className="flex flex-col sm:flex-row gap-4">
                  {["0", "1"].map((v) => (
                    <label key={v} className={`flex-1 flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${wizardData.pengalaman_usaha === v ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 bg-white hover:border-amber-300'}`}>
                      <input type="radio" name="pengalaman_usaha" value={v} checked={wizardData.pengalaman_usaha === v} onChange={() => handleWizardInput("pengalaman_usaha", v)} className="w-5 h-5 text-amber-600" />
                      <span className={`ml-3 font-bold ${wizardData.pengalaman_usaha === v ? 'text-amber-700' : 'text-slate-600'}`}>{v === "0" ? t('recommendations.q10_no') : t('recommendations.q10_yes')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 pb-10">
            <button type="submit" className="bg-[#111111] hover:bg-black text-white font-bold text-sm tracking-widest px-10 py-5 rounded-2xl shadow-xl transition-all flex items-center gap-3 active:scale-95 hover:-translate-y-1 w-full md:w-auto">
              <FiCpu size={22} className="text-indigo-400" /> {t('recommendations.predict_btn')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ───── FASE 3: LOADING ───── */
  if (perintisPhase === 3) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center relative z-10 animate-[spin_4s_linear_infinite]">
            <FiCpu size={48} className="text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4 text-center">{t('recommendations.analyzing_title')}</h2>
        <p className="text-slate-500 text-center max-w-sm text-lg leading-relaxed">{t('recommendations.analyzing_desc')}</p>
      </div>
    );
  }

  /* ───── FASE 4: HASIL ───── */
  if (perintisPhase === 4 && aiResults) {
    return (
      <div className="max-w-6xl mx-auto pb-20 animate-fade-in mt-4">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black tracking-widest uppercase mb-4 border border-indigo-100">
              <FiStar className="mr-2" /> {t('recommendations.analysis_complete')}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">{t('recommendations.recommendation_title')}</h1>
            <p className="text-slate-500 mt-2 text-lg">{t('recommendations.recommendation_desc')}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => { setPerintisPhase(2); setAiResults(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors bg-white shadow-sm">
              <FiRefreshCcw size={16} /> {t('recommendations.recalculate')}
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-md">
              <FiDownload size={16} /> {t('recommendations.save_pdf')}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* LEFT: Ide Bisnis (3 col) */}
          <div className="lg:col-span-3 space-y-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><FiBriefcase className="text-indigo-600" /> {t('recommendations.ai_choice_ideas')}</h3>

            {aiResults.ideas.map((idea, idx) => {
              const isSaved = savedIdeas.includes(idea.id);
              const isExpanded = expandedIdea === idea.id;
              const riskCfg = getRiskConfig(idea.riskLevel);
              const diffCfg = getDifficultyConfig(idea.difficulty);
              return (
                <div key={idea.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all">
                  {/* Card Top */}
                  <div className="p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {idx === 0 && <span className="inline-block mb-3 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">🏆 {t('recommendations.top_match')}</span>}
                        <h4 className="text-2xl font-black text-slate-800 mb-1">{idea.name}</h4>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{idea.type}</p>
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mt-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${riskCfg.bg} ${riskCfg.color} ${riskCfg.border}`}>
                            <span className={`w-2 h-2 rounded-full ${riskCfg.dot}`}></span>{idea.riskLevel === "Rendah" ? t('recommendations.low_risk') : idea.riskLevel === "Menengah" ? t('recommendations.medium_risk') : t('recommendations.high_risk')}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${diffCfg.bg} ${diffCfg.color} ${diffCfg.border}`}>
                            <FiActivity size={11} /> {idea.difficulty === "Pemula" ? t('recommendations.beginner_level') : t('recommendations.intermediate_level')}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-center">
                          <div className="text-4xl font-black text-emerald-600">{idea.match}%</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{t('recommendations.eligibility')}</div>
                        </div>
                        <button onClick={() => setSavedIdeas(p => p.includes(idea.id) ? p.filter(i => i !== idea.id) : [...p, idea.id])}
                          className={`p-2 rounded-full transition-all ${isSaved ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:bg-slate-100 hover:text-rose-400'}`}>
                          <FiHeart size={22} className={isSaved ? "fill-current" : ""} />
                        </button>
                      </div>
                    </div>

                    <hr className="my-6 border-slate-100" />

                    <div className="grid grid-cols-2 gap-5 mb-6">
                      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('recommendations.capex_rec')}</p><p className="text-sm text-slate-600 font-medium leading-relaxed">{idea.capexDesc}</p></div>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('recommendations.opex_rec')}</p><p className="text-sm text-slate-600 font-medium leading-relaxed">{idea.opexDesc}</p></div>
                    </div>
                  </div>

                  {/* AI INSIGHTS — COLLAPSIBLE */}
                  <div className={`border-t border-slate-100 transition-all duration-300 ${isExpanded ? 'block' : 'hidden'}`}>
                    {/* Risiko */}
                    <div className="p-7 border-b border-slate-100">
                      <h5 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-base"><FiAlertTriangle className="text-amber-500" /> {t('recommendations.risk_analysis')}</h5>
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-4">
                        <p className="text-sm text-amber-800 leading-relaxed font-medium">{idea.riskDescription}</p>
                      </div>
                    </div>
                    {/* Potensi & Radar */}
                    <div className="p-7 border-b border-slate-100">
                      <h5 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-base"><FiTrendingUp className="text-emerald-500" /> {t('recommendations.growth_potential')}</h5>
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-6">
                        <p className="text-sm text-emerald-800 leading-relaxed font-medium">{idea.growthPotential}</p>
                      </div>
                      {/* Radar Chart */}
                      <h5 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-base"><FiBarChart2 className="text-indigo-500" /> {t('recommendations.multi_score')}</h5>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={idea.radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                            <Radar name="Skor" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: '#4f46e5' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    {/* Tips Sukses */}
                    <div className="p-7">
                      <h5 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-base"><FiZap className="text-indigo-500" /> {t('recommendations.success_tips')}</h5>
                      <ul className="space-y-3">
                        {idea.successTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{i + 1}</div>
                            <span className="text-sm text-slate-700 font-medium leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                    <button onClick={() => setExpandedIdea(isExpanded ? null : idea.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-indigo-200 text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-colors bg-white">
                      {isExpanded ? t('recommendations.hide_detail') : t('recommendations.view_full_analysis')} <FiInfo size={16} />
                    </button>
                    <button disabled={isUpgrading} onClick={() => handleStartBusiness(idea)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#111111] hover:bg-black text-white py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md disabled:opacity-70">
                      {isUpgrading ? t('recommendations.processing') : t('recommendations.start_business_plan')} <FiArrowRight />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Simulasi & Ringkasan (2 col) */}
          <div className="lg:col-span-2 space-y-6 sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto pr-2 pb-4" style={{ scrollbarWidth: 'thin' }}>
            {/* Simulasi Anggaran */}
            <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-1 flex items-center gap-2"><FiPieChart className="text-teal-500" /> {t('recommendations.budget_simulation')}</h3>
              <p className="text-slate-500 text-xs font-medium mb-6">{t('recommendations.total_capital')} Rp {wizardData.modal_awal}</p>
              <div className="h-52 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={aiResults.allocations} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                      {aiResults.allocations.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {aiResults.allocations.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></div><span className="font-bold text-sm text-slate-700">{item.name}</span></div>
                    <span className="font-black text-sm text-slate-800">{formatRupiah(item.value)}</span>
                  </div>
                ))}
              </div>

              {/* Target Profit Bulanan */}
              <div className="mt-5 bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
                <h4 className="font-black text-emerald-800 mb-2 flex items-center gap-2 text-sm"><FiTarget className="text-emerald-600" /> {t('recommendations.monthly_profit_target')}</h4>
                <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                  <Trans i18nKey="recommendations.return_capital_desc" values={{ modal: wizardData.modal_awal, bulan: wizardData.target_roi_bulan }}>
                    Untuk mengembalikan <strong>Rp {{modal: wizardData.modal_awal}}</strong> dalam <strong>{{bulan: wizardData.target_roi_bulan}} bulan</strong>, Anda perlu membidik keuntungan bersih minimal:
                  </Trans>
                </p>
                <div className="mt-3 text-2xl font-black text-emerald-700">{formatRupiah(targetProfitBulanan)}<span className="text-sm font-bold text-emerald-500">{t('recommendations.per_month')}</span></div>
              </div>

              {/* Timeline Indikator */}
              <div className="mt-4 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                <FiClock className="text-indigo-500 mt-0.5 shrink-0" size={18} />
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                  <Trans i18nKey="recommendations.timeline_indicator" values={{ bulan: wizardData.target_roi_bulan, limit: formatRupiah(targetProfitBulanan / 2) }}>
                    Estimasi balik modal: <strong>bulan ke-{{bulan: wizardData.target_roi_bulan}}</strong>. Jaga pengeluaran OPEX di bawah {{limit: formatRupiah(targetProfitBulanan / 2)}} / bulan di awal operasional.
                  </Trans>
                </p>
              </div>
            </div>

            {/* Info Card Ide Tersimpan */}
            {savedIdeas.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                  <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center shrink-0">
                    <FiHeart size={16} className="text-rose-500 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">{t('recommendations.saved_ideas')}</h4>
                    <p className="text-xs text-slate-400 font-medium">{t('recommendations.saved_ideas_count', { count: savedIdeas.length })}</p>
                  </div>
                </div>
                {/* List */}
                <div className="divide-y divide-slate-50">
                  {aiResults.ideas.filter(idea => savedIdeas.includes(idea.id)).map(idea => (
                    <div key={idea.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-2 h-2 bg-rose-400 rounded-full shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">{idea.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{idea.match}% kelayakan · Risiko {idea.riskLevel}</p>
                      </div>
                      <button
                        onClick={() => setSavedIdeas(p => p.filter(i => i !== idea.id))}
                        className="text-slate-300 hover:text-rose-400 transition-colors shrink-0"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Recommendations;
