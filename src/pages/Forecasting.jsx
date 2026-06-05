import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { FiTrendingUp, FiAlertTriangle, FiCpu, FiCalendar, FiAlertCircle } from "react-icons/fi";
import transactionService from "../services/transactionService";

const formatRp = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);

export default function Forecasting() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState([]);
  const [recommendation, setRecommendation] = useState("");
  const [confidenceInterval, setConfidenceInterval] = useState(85);
  const [modelUsed, setModelUsed] = useState("LSTM");
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchAIForecast = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const res = await transactionService.getForecast();
        const data = res.data?.data || res.data || {};
        
        let combinedData = [];
        if (data.actual_data || data.ai_prediction) {
          const actualMapped = (data.actual_data || []).map(item => ({
            date: item.date,
            Aktual: item.net_cashflow,
            Prediksi: null
          }));

          const predictionMapped = (data.ai_prediction || []).map(item => ({
            date: item.date,
            Aktual: null,
            Prediksi: item.predicted_net_cashflow
          }));

          if (actualMapped.length > 0 && predictionMapped.length > 0) {
            // Hubungkan titik terakhir aktual dengan titik pertama prediksi agar grafiknya kontinu
            actualMapped[actualMapped.length - 1].Prediksi = actualMapped[actualMapped.length - 1].Aktual;
          }
          combinedData = [...actualMapped, ...predictionMapped];
        } else if (data.forecast_data) {
          combinedData = (data.forecast_data || []).map(item => ({
            date: item.date,
            Aktual: item.actual,
            Prediksi: item.predicted
          }));
        }
        
        setForecastData(combinedData);
        setRecommendation(data.insight || data.recommendation || t('forecasting.ai_strategy_desc'));
        setConfidenceInterval(data.confidence_interval || 85);
        setModelUsed(data.method_used || data.model_used || "LSTM");
      } catch (err) {
        console.error("Gagal mengambil prediksi AI:", err);
        const status = err.response?.status;
        const backendMsg = err.response?.data?.message || err.response?.data?.error || err.message;
        if (status === 500) {
          setApiError(`Server Error (500): Microservice AI Forecasting tidak dapat diakses. ${backendMsg}`);
        } else {
          setApiError(backendMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAIForecast();
  }, []);

  // Temukan titik persimpangan (hari ini) di mana data aktual dan prediksi bertemu
  const todaySplitDate = forecastData.find(d => d.Aktual !== null && d.Prediksi !== null)?.date || "10 Jun";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Error Banner */}
      {apiError && !loading && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-6">
          {/* Jika 500 → kemungkinan data transaksi belum cukup untuk AI */}
          {apiError.toLowerCase().includes('500') || apiError.toLowerCase().includes('internal') || apiError.toLowerCase().includes('server') ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border border-amber-100">
                <FiAlertTriangle size={36} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Data Transaksi Belum Cukup</h3>
              <p className="text-slate-500 font-medium max-w-md leading-relaxed mb-2">
                Model AI membutuhkan <strong>data historis transaksi minimal 30 hari</strong> untuk menghasilkan prediksi arus kas yang akurat.
              </p>
              <p className="text-slate-400 text-sm max-w-md mb-8">
                Silakan tambahkan lebih banyak data pemasukan &amp; pengeluaran di menu <strong>Transaksi</strong>, lalu kembali ke halaman ini.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="/dashboard/transactions"
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                >
                  <FiTrendingUp size={16} /> Tambah Transaksi
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Coba Lagi
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-6 bg-slate-50 rounded-lg px-4 py-2 border border-slate-100">
                Detail teknis: {apiError}
              </p>
            </div>
          ) : (
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <FiAlertCircle className="text-rose-500 shrink-0" size={20} />
                <p className="text-sm font-semibold text-rose-700">{apiError}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="ml-8 mt-1 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors shadow-sm"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{t('forecasting.title')}</h1>
          <p className="text-slate-500 font-medium mt-1">{t('forecasting.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold text-sm border border-indigo-100 shadow-sm">
          <FiCpu className="animate-pulse" /> Model AI Aktif ({modelUsed})
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center h-[500px]">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <h3 className="font-bold text-slate-800 text-lg">Menjalankan Inference Model...</h3>
          <p className="text-slate-500 text-sm mt-2">Terhubung ke Microservice FastAPI AI</p>
        </div>
      ) : (
        <>
          {/* AI Insight Alert */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-lg text-white flex gap-4 items-start relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 border border-white/20">
              <FiTrendingUp size={24} />
            </div>
            <div className="relative z-10">
              <h3 className="font-black text-lg mb-1">{t('forecasting.ai_strategy')}</h3>
              <p className="text-indigo-100 font-medium leading-relaxed">{recommendation}</p>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-slate-500">
                    <FiCalendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800">{t('forecasting.projection_chart_title')}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">CONFIDENCE INTERVAL {confidenceInterval}%</p>
                  </div>
                </div>
                
                {/* Legend Kustom */}
                <div className="flex items-center gap-4 text-sm font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                    <span className="text-slate-600">{t('forecasting.actual_data')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-slate-600">{t('forecasting.ai_prediction')}</span>
                  </div>
                </div>
             </div>

             <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={forecastData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrediksi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAktual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={15} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                      tickFormatter={(value) => `Rp ${value/1000}k`}
                      dx={-10}
                    />
                    <RechartsTooltip 
                      formatter={(value) => formatRp(value)}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
                    />
                    
                    {/* Garis vertikal pembatas Masa Lalu & Prediksi (10 Jun) */}
                    <ReferenceLine x={todaySplitDate} stroke="#cbd5e1" strokeDasharray="5 5" label={{ position: 'top', value: t('forecasting.today'), fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                    
                    <Area 
                      type="monotone" 
                      dataKey="Aktual" 
                      stroke="#94a3b8" 
                      strokeWidth={4} 
                      fill="url(#colorAktual)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#64748b' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Prediksi" 
                      stroke="#6366f1" 
                      strokeWidth={4} 
                      strokeDasharray="8 6" // Garis putus-putus elegan untuk prediksi
                      fill="url(#colorPrediksi)" 
                      activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff', fill: '#4f46e5' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-5 py-4 rounded-xl mt-6">
             <FiAlertTriangle size={20} className="shrink-0" />
             <p className="text-sm font-medium">{t('forecasting.disclaimer')}</p>
          </div>
        </>
      )}
    </div>
  );
}
