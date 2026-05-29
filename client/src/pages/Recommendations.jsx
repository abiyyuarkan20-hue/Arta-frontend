import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import api from "../services/api";
import { 
  FiArrowRight, FiArrowLeft, FiCpu, FiStar, FiBriefcase,
  FiPieChart, FiInfo, FiDownload, FiRefreshCcw, FiTrendingUp,
  FiClock, FiTarget, FiChevronDown, FiAlertTriangle, FiZap
} from "react-icons/fi";
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number || 0);
};

const PIE_COLORS = ['#4f46e5', '#f59e0b', '#10b981'];

const SEKTOR_OPTIONS = [
  { id: "Jasa & Layanan Umum", label: "Jasa & Layanan Umum" },
  { id: "Kuliner (F&B)", label: "Kuliner (F&B)" },
  { id: "Ritel & Perdagangan", label: "Ritel & Perdagangan" },
  { id: "Teknologi & Digital", label: "Teknologi & Digital" },
  { id: "Manufaktur & Produksi", label: "Manufaktur & Produksi" },
  { id: "Pertanian & Agribisnis", label: "Pertanian & Agribisnis" },
  { id: "Kesehatan & Kecantikan", label: "Kesehatan & Kecantikan" },
  { id: "Lainnya", label: "Lainnya" }
];

const LOKASI_OPTIONS = [
  { id: "Pinggir Jalan Raya Utama", label: "Pinggir Jalan Raya Utama" },
  { id: "Pusat Perbelanjaan / Mall", label: "Pusat Perbelanjaan / Mall" },
  { id: "Area Perkantoran", label: "Area Perkantoran" },
  { id: "Kawasan Pemukiman / Perumahan", label: "Kawasan Pemukiman / Perumahan" },
  { id: "Lingkungan Kampus / Sekolah", label: "Lingkungan Kampus / Sekolah" },
  { id: "Online / Dari Rumah", label: "Online / Dari Rumah" }
];

const TARGET_PASAR_OPTIONS = [
  { id: "Anak-anak", label: "Anak-anak" },
  { id: "Remaja", label: "Remaja" },
  { id: "Dewasa", label: "Dewasa" },
  { id: "Lansia", label: "Lansia" },
  { id: "Keluarga", label: "Keluarga" },
  { id: "Perusahaan (B2B)", label: "Perusahaan (B2B)" },
  { id: "Umum (Semua Usia)", label: "Umum (Semua Usia)" }
];

const PENDIDIKAN_OPTIONS = [
  { id: "SD", label: "SD" },
  { id: "SMP", label: "SMP" },
  { id: "SMA / Sederajat", label: "SMA / Sederajat" },
  { id: "Diploma (D1-D4)", label: "Diploma (D1-D4)" },
  { id: "Sarjana (S1+)", label: "Sarjana (S1+)" }
];

const KEAHLIAN_OPTIONS = [
  { id: "Pemrograman / IT", label: "Pemrograman / IT" },
  { id: "Desain / Kreatif", label: "Desain / Kreatif" },
  { id: "Memasak / Tata Boga", label: "Memasak / Tata Boga" },
  { id: "Penjualan / Marketing", label: "Penjualan / Marketing" },
  { id: "Manajemen / Administrasi", label: "Manajemen / Administrasi" },
  { id: "Teknik / Otomotif", label: "Teknik / Otomotif" },
  { id: "Kecantikan / Salon", label: "Kecantikan / Salon" },
  { id: "Pendidikan / Mengajar", label: "Pendidikan / Mengajar" },
  { id: "Tidak Ada Keahlian Khusus", label: "Tidak Ada Keahlian Khusus" }
];

const NumberInput = ({ label, value, onChange, min, max, unit, description }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col mb-4">
      <label className="block text-base font-medium text-slate-800 mb-2">{label} <span className="text-red-500">*</span></label>
      {description && <p className="text-sm text-slate-500 mb-4">{description}</p>}
      <div className="flex items-center gap-3 sm:w-1/2">
        <input type="number" min={min} max={max} value={value} onChange={(e) => onChange(e.target.value)} className="w-full py-2 border-b border-slate-300 focus:border-indigo-600 outline-none text-slate-800 transition-colors bg-transparent" placeholder="Jawaban Anda" />
        {unit && <span className="text-slate-500 shrink-0">{unit}</span>}
      </div>
    </div>
  );
};

const ComboboxField = ({ label, value, onChange, options, placeholder, description }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentLabel = options.find(o => o.id === value)?.label || value;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col mb-4 relative">
      <label className="block text-base font-medium text-slate-800 mb-2">{label} <span className="text-red-500">*</span></label>
      {description && <p className="text-sm text-slate-500 mb-4">{description}</p>}
      <div className="relative sm:w-1/2">
        <input 
          type="text" 
          value={currentLabel} 
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className="w-full py-2 pr-8 border-b border-slate-300 focus:border-indigo-600 outline-none text-slate-800 transition-colors bg-transparent cursor-pointer"
          readOnly
        />
        <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none text-slate-400">
          <FiChevronDown size={20} />
        </div>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto p-1">
            {options.map(opt => (
              <div 
                key={opt.id} 
                className="px-4 py-2 rounded-md cursor-pointer hover:bg-slate-100 text-slate-700"
                onMouseDown={(e) => { e.preventDefault(); onChange(opt.id); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RadioGroup = ({ label, description, options, name, value, onChange }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col mb-4">
      <label className="block text-base font-medium text-slate-800 mb-2">{label} <span className="text-red-500">*</span></label>
      {description && <p className="text-sm text-slate-500 mb-4">{description}</p>}
      <div className="flex flex-col gap-4 mt-2">
        {options.map((opt) => (
          <label key={opt.v} className="flex items-center gap-3 cursor-pointer group w-fit">
            <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
              <input type="radio" name={name} value={opt.v} checked={value === opt.v} onChange={() => onChange(opt.v)} className="appearance-none w-5 h-5 border-2 border-slate-400 rounded-full checked:border-indigo-600 transition-colors cursor-pointer group-hover:border-indigo-400" />
              {value === opt.v && <div className="absolute w-2.5 h-2.5 bg-indigo-600 rounded-full pointer-events-none"></div>}
            </div>
            <span className="text-slate-700 font-normal leading-none">{opt.l}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const Recommendations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [perintisPhase, setPerintisPhase] = useState(2);
  const [wizardData, setWizardData] = useState({
    initial_capital: "",
    tools_materials_percentage: "",
    marketing_percentage: "",
    roi_target_months: "",
    business_sector: "",
    strategic_location: "",
    target_market: "",
    last_education: "",
    technical_expertise: "",
    has_business_experience: ""
  });
  const [aiResults, setAiResults] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleWizardInput = (key, val) => { 
    setWizardData(p => ({ ...p, [key]: val })); 
    if (errorMsg) setErrorMsg(""); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      initial_capital, tools_materials_percentage, marketing_percentage,
      roi_target_months, business_sector, strategic_location, target_market,
      last_education, technical_expertise, has_business_experience
    } = wizardData;

    if (!initial_capital || !tools_materials_percentage || !marketing_percentage ||
        !roi_target_months || !business_sector || !strategic_location ||
        !target_market || !last_education || !technical_expertise || !has_business_experience) {
      setErrorMsg(t('recommendations.fill_all_warning') || "Harap isi semua kolom wajib.");
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
      return;
    }

    setPerintisPhase(3); 
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const payload = {
        initial_capital: Number(initial_capital),
        tools_materials_percentage: Number(tools_materials_percentage),
        marketing_percentage: Number(marketing_percentage),
        roi_target_months: Number(roi_target_months),
        business_sector,
        strategic_location,
        target_market,
        last_education,
        technical_expertise,
        has_business_experience: has_business_experience === "true"
      };

      const res = await api.post("/api/feasibility-tests", payload);
      setAiResults(res.data);
      setPerintisPhase(4);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Gagal menghubungi server AI. Silakan coba lagi nanti.");
      setPerintisPhase(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /* ───── FASE 2: FORMULIR ───── */
  if (perintisPhase === 2) {
    return (
      <div className="max-w-3xl mx-auto pb-20 animate-fade-in mt-4 font-sans bg-slate-50/50 p-2 sm:p-0 min-h-screen">
        <div className="mb-6">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"><FiArrowLeft /> {t('recommendations.back') || 'Kembali'}</button>
        </div>
        
        {/* Header Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
          <div className="h-3 bg-indigo-600 w-full"></div>
          <div className="p-8">
            <h1 className="text-3xl font-normal text-slate-800 mb-2">{t('recommendations.questionnaire_title') || "Uji Kelayakan Bisnis"}</h1>
            <p className="text-slate-600">{t('recommendations.questionnaire_desc') || "Jawab pertanyaan berikut agar AI Arta dapat memprediksi kelayakan bisnis Anda secara akurat."}</p>
            <hr className="my-6 border-slate-200" />
            <p className="text-sm text-red-500">* Menunjukkan pertanyaan yang wajib diisi</p>
          </div>
        </div>

        {errorMsg && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm shadow-sm"><FiInfo className="shrink-0" /> {errorMsg}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Section A: Rencana Modal & Finansial */}
          <div className="bg-indigo-600 text-white p-4 rounded-t-xl shadow-sm mt-8">
            <h2 className="text-lg font-medium">A. Rencana Modal & Finansial</h2>
          </div>
          <div className="bg-white p-1 rounded-b-xl border border-t-0 border-slate-200 shadow-sm mb-4"></div>

          <NumberInput label="Berapa total modal awal yang Anda persiapkan?" value={wizardData.initial_capital} onChange={(v) => handleWizardInput("initial_capital", v)} min={0} unit="Rp" description="Masukkan perkiraan total dana awal untuk merintis bisnis." />
          <NumberInput label="Berapa persen alokasi modal untuk alat & bahan baku?" value={wizardData.tools_materials_percentage} onChange={(v) => handleWizardInput("tools_materials_percentage", v)} min={0} max={100} unit="%" description="Persentase dari modal awal (0-100)." />
          <NumberInput label="Berapa persen alokasi modal untuk promosi/marketing?" value={wizardData.marketing_percentage} onChange={(v) => handleWizardInput("marketing_percentage", v)} min={0} max={100} unit="%" description="Persentase dari modal awal (0-100)." />
          <NumberInput label="Dalam berapa bulan target balik modal (ROI) Anda?" value={wizardData.roi_target_months} onChange={(v) => handleWizardInput("roi_target_months", v)} min={1} max={120} unit="Bulan" description="Contoh: 12 untuk target satu tahun balik modal." />

          {/* Section B: Detail Bisnis */}
          <div className="bg-emerald-600 text-white p-4 rounded-t-xl shadow-sm mt-8">
            <h2 className="text-lg font-medium">B. Detail & Lokasi Bisnis</h2>
          </div>
          <div className="bg-white p-1 rounded-b-xl border border-t-0 border-slate-200 shadow-sm mb-4"></div>

          <ComboboxField label="Sektor / Jenis Bisnis" value={wizardData.business_sector} onChange={(v) => handleWizardInput("business_sector", v)} options={SEKTOR_OPTIONS} placeholder="Pilih sektor bisnis" />
          <ComboboxField label="Lokasi Strategis Bisnis Anda" value={wizardData.strategic_location} onChange={(v) => handleWizardInput("strategic_location", v)} options={LOKASI_OPTIONS} placeholder="Pilih lokasi target" />
          <ComboboxField label="Target Pasar / Konsumen Utama" value={wizardData.target_market} onChange={(v) => handleWizardInput("target_market", v)} options={TARGET_PASAR_OPTIONS} placeholder="Pilih target pasar" />
          
          {/* Section C: Profil Pengusaha */}
          <div className="bg-amber-500 text-white p-4 rounded-t-xl shadow-sm mt-8">
            <h2 className="text-lg font-medium">C. Latar Belakang Anda</h2>
          </div>
          <div className="bg-white p-1 rounded-b-xl border border-t-0 border-slate-200 shadow-sm mb-4"></div>

          <ComboboxField label="Pendidikan Terakhir" value={wizardData.last_education} onChange={(v) => handleWizardInput("last_education", v)} options={PENDIDIKAN_OPTIONS} placeholder="Pilih pendidikan terakhir" />
          <ComboboxField label="Keahlian Khusus yang Dimiliki" value={wizardData.technical_expertise} onChange={(v) => handleWizardInput("technical_expertise", v)} options={KEAHLIAN_OPTIONS} placeholder="Pilih keahlian khusus utama" />
          <RadioGroup label="Apakah Anda pernah menjalankan bisnis sebelumnya?" name="has_business_experience" value={wizardData.has_business_experience} onChange={(v) => handleWizardInput("has_business_experience", v)} options={[{v: "true", l: "Ya, Pernah"}, {v: "false", l: "Belum Pernah (Pertama Kali)"}]} />

          <div className="flex justify-between items-center pt-6 pb-10">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-md transition-colors shadow-sm">
              Analisis Kelayakan Bisnis
            </button>
            <button type="button" onClick={() => {
              setWizardData({
                initial_capital: "", tools_materials_percentage: "", marketing_percentage: "", 
                roi_target_months: "", business_sector: "", strategic_location: "", 
                target_market: "", last_education: "", technical_expertise: "", has_business_experience: ""
              });
              setErrorMsg("");
            }} className="text-slate-500 text-sm hover:text-slate-800 font-medium px-4 py-2 rounded hover:bg-slate-100 transition-colors">
              Kosongkan formulir
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
        <h2 className="text-3xl font-black text-slate-800 mb-4 text-center">{t('recommendations.analyzing_title') || "Menghitung Kelayakan..."}</h2>
        <p className="text-slate-500 text-center max-w-sm text-lg leading-relaxed">{t('recommendations.analyzing_desc') || "Model AI kami sedang memproses seluruh variabel yang Anda masukkan."}</p>
      </div>
    );
  }

  /* ───── FASE 4: HASIL ───── */
  if (perintisPhase === 4 && aiResults) {
    const { ai_prediction, saved_data } = aiResults;
    const { feasibility_score, status, recommendation } = ai_prediction;
    
    const modalAwalNum = saved_data.initial_capital;
    const toolsPct = saved_data.tools_materials_percentage;
    const mktPct = saved_data.marketing_percentage;
    const otherPct = Math.max(0, 100 - toolsPct - mktPct);

    const capex = (modalAwalNum * toolsPct) / 100;
    const pemasaran = (modalAwalNum * mktPct) / 100;
    const opex = (modalAwalNum * otherPct) / 100;

    const targetBulanNum = saved_data.roi_target_months;
    const targetProfitBulanan = modalAwalNum / targetBulanNum;

    const allocations = [
      { name: 'Alat & Bahan Baku', value: capex },
      { name: 'Pemasaran & Promosi', value: pemasaran },
      { name: 'Operasional Lainnya', value: opex },
    ];

    const isLayak = status.toLowerCase() === "layak";

    return (
      <div className="max-w-6xl mx-auto pb-20 animate-fade-in mt-4">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black tracking-widest uppercase mb-4 border border-indigo-100">
              <FiStar className="mr-2" /> Analisis AI Selesai
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">Hasil Kelayakan Bisnis</h1>
            <p className="text-slate-500 mt-2 text-lg">Berdasarkan profil Anda, model AI Arta memberikan skor kelayakan berikut.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => { setPerintisPhase(2); setAiResults(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors bg-white shadow-sm">
              <FiRefreshCcw size={16} /> Hitung Ulang
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-md">
              <FiDownload size={16} /> Simpan PDF
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* LEFT: Prediksi AI Utama (3 col) */}
          <div className="lg:col-span-3 space-y-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><FiBriefcase className="text-indigo-600" /> Hasil Evaluasi Sistem Arta</h3>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className={`inline-block mb-3 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${isLayak ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      STATUS: {status}
                    </span>
                    <h4 className="text-2xl font-black text-slate-800 mb-1">{saved_data.business_sector}</h4>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{saved_data.strategic_location} — {saved_data.target_market}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-center">
                      <div className={`text-5xl font-black ${isLayak ? 'text-emerald-600' : 'text-amber-500'}`}>{feasibility_score.toFixed(1)}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Skor Kelayakan</div>
                    </div>
                  </div>
                </div>

                <hr className="my-6 border-slate-100" />

                <div className="mb-6">
                  <h5 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-base"><FiZap className="text-indigo-500" /> Rekomendasi & Insight AI</h5>
                  <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl">
                    <p className="text-base text-slate-700 leading-relaxed font-medium">{recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button disabled={isUpgrading} onClick={() => {
                  alert("Fitur simpan draft rencana bisnis belum diaktifkan dalam demo ini.");
                }}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#111111] hover:bg-black text-white py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md disabled:opacity-70">
                  {isUpgrading ? "Memproses..." : "Lanjut Buat Rencana Bisnis"} <FiArrowRight />
                </button>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-start gap-4">
              <FiAlertTriangle className="text-amber-500 mt-1 shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-amber-800">Catatan Risiko Sistem</h4>
                <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                  Hasil ini merupakan kalkulasi *probabilitas* dan bergantung sepenuhnya pada akurasi eksekusi lapangan, kondisi ekonomi, serta ketepatan informasi yang Anda input di kuesioner. Model prediktif Arta memberikan panduan arah, bukan garansi kepastian keuntungan.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Simulasi Anggaran (2 col) */}
          <div className="lg:col-span-2 space-y-6 sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto pr-2 pb-4" style={{ scrollbarWidth: 'thin' }}>
            <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-1 flex items-center gap-2"><FiPieChart className="text-teal-500" /> Simulasi Anggaran</h3>
              <p className="text-slate-500 text-xs font-medium mb-6">Total Modal (Rencana): Rp {modalAwalNum.toLocaleString('id-ID')}</p>
              <div className="h-52 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                  <PieChart>
                    <Pie data={allocations} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                      {allocations.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(v) => formatRupiah(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {allocations.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></div><span className="font-bold text-sm text-slate-700">{item.name}</span></div>
                    <span className="font-black text-sm text-slate-800">{formatRupiah(item.value)}</span>
                  </div>
                ))}
              </div>

              {/* Target Profit Bulanan */}
              <div className="mt-5 bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
                <h4 className="font-black text-emerald-800 mb-2 flex items-center gap-2 text-sm"><FiTarget className="text-emerald-600" /> Target Profit Minimum</h4>
                <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                  Untuk mengembalikan <strong>Rp {modalAwalNum.toLocaleString('id-ID')}</strong> dalam <strong>{targetBulanNum} bulan</strong> (ROI), Anda perlu membidik keuntungan bersih minimal:
                </p>
                <div className="mt-3 text-2xl font-black text-emerald-700">{formatRupiah(targetProfitBulanan)}<span className="text-sm font-bold text-emerald-500"> / bulan</span></div>
              </div>

              {/* Timeline Indikator */}
              <div className="mt-4 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                <FiClock className="text-indigo-500 mt-0.5 shrink-0" size={18} />
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                  Jaga pengeluaran <strong>Operasional (OPEX)</strong> serendah mungkin di masa awal. Hindari pengeluaran operasional melebihi nilai target profit jika tidak ada kepastian pendanaan dari kas cadangan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Recommendations;
