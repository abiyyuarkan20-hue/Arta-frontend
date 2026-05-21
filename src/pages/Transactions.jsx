import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  FiPlus, FiSearch, FiFilter, FiDownload, FiMoreVertical, 
  FiArrowUpRight, FiArrowDownRight, FiX, FiZap, FiLoader,
  FiUploadCloud, FiPaperclip, FiEdit2, FiTrash2
} from "react-icons/fi";

// --- INITIAL DATA ---
const initialTransactions = [
  { id: 1, date: "2026-05-12", description: "Penjualan Produk A (10 pcs)", category: "Penjualan", type: "Pemasukan", amount: 1500000, invoice: null },
  { id: 2, date: "2026-05-11", description: "Beli bahan baku tepung & telur", category: "Bahan Baku", type: "Pengeluaran", amount: 450000, invoice: "Nota_Bahan_Baku.jpg" },
  { id: 3, date: "2026-05-10", description: "Bayar token listrik toko", category: "Operasional", type: "Pengeluaran", amount: 200000, invoice: "Struk_PLN_Mei.pdf" },
  { id: 4, date: "2026-05-09", description: "Penjualan Grosir B", category: "Penjualan", type: "Pemasukan", amount: 3200000, invoice: null },
  { id: 5, date: "2026-05-08", description: "Iklan Instagram/Facebook Ads", category: "Pemasaran", type: "Pengeluaran", amount: 150000, invoice: null },
  { id: 6, date: "2026-05-05", description: "Servis mesin pemotong", category: "Peralatan", type: "Pengeluaran", amount: 350000, invoice: "Kwitansi_Servis.jpg" },
  { id: 7, date: "2026-05-01", description: "Gaji Karyawan (Bulan Lalu)", category: "Gaji", type: "Pengeluaran", amount: 2500000, invoice: null },
];

const categories = [
  "Penjualan", "Bahan Baku", "Operasional", "Pemasaran", "Gaji", "Peralatan", "Lainnya"
];

const categoryColors = {
  "Penjualan": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Bahan Baku": "bg-amber-100 text-amber-700 border-amber-200",
  "Operasional": "bg-blue-100 text-blue-700 border-blue-200",
  "Pemasaran": "bg-purple-100 text-purple-700 border-purple-200",
  "Gaji": "bg-rose-100 text-rose-700 border-rose-200",
  "Peralatan": "bg-slate-100 text-slate-700 border-slate-200",
  "Lainnya": "bg-gray-100 text-gray-700 border-gray-200",
};

export default function Transactions() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterDate, setFilterDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    type: "Pengeluaran",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    category: "",
    description: "",
    invoiceFile: null,
  });
  
  const [isAILoading, setIsAILoading] = useState(false);

  // --- CALCULATION LOGIC ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      const matchSearch = trx.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === "Semua" || trx.category === filterCategory;
      const matchDate = filterDate ? trx.date === filterDate : true;
      return matchSearch && matchCategory && matchDate;
    });
  }, [searchTerm, filterCategory, filterDate, transactions]);

  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(trx => {
      if (trx.type === "Pemasukan") income += trx.amount;
      else if (trx.type === "Pengeluaran") expense += trx.amount;
    });
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // --- HANDLERS ---
  const handleAIPredict = () => {
    if (!formData.description) return;
    setIsAILoading(true);
    
    // Simulate AI delay
    setTimeout(() => {
      const desc = formData.description.toLowerCase();
      let predictedCategory = "Lainnya";
      
      if (desc.includes("jual") || desc.includes("pesanan") || desc.includes("omset")) predictedCategory = "Penjualan";
      else if (desc.includes("listrik") || desc.includes("air") || desc.includes("internet")) predictedCategory = "Operasional";
      else if (desc.includes("bahan") || desc.includes("beli")) predictedCategory = "Bahan Baku";
      else if (desc.includes("iklan") || desc.includes("ads") || desc.includes("promo")) predictedCategory = "Pemasaran";
      else if (desc.includes("gaji") || desc.includes("honor")) predictedCategory = "Gaji";

      setFormData(prev => ({ ...prev, category: predictedCategory }));
      setIsAILoading(false);
    }, 1200);
  };

  const handleEditClick = (trx) => {
    setEditingId(trx.id);
    setFormData({
      type: trx.type,
      amount: trx.amount.toString(),
      date: trx.date,
      category: trx.category,
      description: trx.description,
      invoiceFile: null,
    });
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm(t('transactions.confirm_delete'))) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleSaveTransaction = () => {
    if (!formData.amount || !formData.date || !formData.description || !formData.category) {
      alert(t('transactions.fill_all'));
      return;
    }
    
    if (editingId) {
      setTransactions(transactions.map(t => {
        if (t.id === editingId) {
          return {
            ...t,
            date: formData.date,
            description: formData.description,
            category: formData.category,
            type: formData.type,
            amount: Number(formData.amount),
            ...(formData.invoiceFile ? {
              invoice: formData.invoiceFile.name,
              invoiceUrl: URL.createObjectURL(formData.invoiceFile)
            } : {})
          };
        }
        return t;
      }));
    } else {
      const newTransaction = {
        id: Date.now(),
        date: formData.date,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        amount: Number(formData.amount),
        invoice: formData.invoiceFile ? formData.invoiceFile.name : null,
        invoiceUrl: formData.invoiceFile ? URL.createObjectURL(formData.invoiceFile) : null,
      };
      setTransactions([newTransaction, ...transactions]);
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    
    // Reset form
    setFormData({
      type: "Pengeluaran",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      category: "",
      description: "",
      invoiceFile: null,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 1. Header & Panel Metrik Ringkas */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-6">{t('transactions.title')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card: Pemasukan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">{t('transactions.income_this_month')}</p>
              <h3 className="text-2xl font-black text-emerald-600">{formatRupiah(metrics.income)}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <FiArrowUpRight size={24} />
            </div>
          </div>
          
          {/* Card: Pengeluaran */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">{t('transactions.expense_this_month')}</p>
              <h3 className="text-2xl font-black text-rose-600">{formatRupiah(metrics.expense)}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
              <FiArrowDownRight size={24} />
            </div>
          </div>

          {/* Card: Arus Kas Bersih */}
          <div className="bg-white p-5 rounded-2xl border-2 border-blue-50 shadow-md hover:shadow-lg transition-shadow flex items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-slate-500 mb-1">{t('transactions.net_cash_flow')}</p>
              <h3 className={`text-2xl font-black ${metrics.balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                {metrics.balance >= 0 ? '+' : ''}{formatRupiah(metrics.balance)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Action & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search & Filters */}
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          <div className="relative w-full sm:max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={t('transactions.search_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 font-medium"
            />
          </div>
          
          <div className="relative w-full sm:w-48">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 font-medium appearance-none cursor-pointer"
            >
              <option value="Semua">{t('transactions.all_categories')}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="relative w-full sm:w-44 flex items-center">
            <input 
              type="date" 
              title="Filter Tanggal"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-700 font-medium cursor-pointer"
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate("")}
                className="absolute right-10 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-500 rounded-full transition-colors"
                title="Hapus Filter Tanggal"
              >
                <FiX size={12} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
            <FiDownload />
            <span className="hidden sm:inline">{t('transactions.export_csv')}</span>
          </button>
          
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({
                type: "Pengeluaran",
                amount: "",
                date: new Date().toISOString().split('T')[0],
                category: "",
                description: "",
                invoiceFile: null,
              });
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            <FiPlus size={18} />
            <span>{t('transactions.add_transaction')}</span>
          </button>
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4 flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors">{t('transactions.table_date')} <span className="text-[10px] text-slate-400">▼</span></th>
                <th className="px-6 py-4">{t('transactions.table_desc')}</th>
                <th className="px-6 py-4">{t('transactions.table_category')}</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:text-blue-600 transition-colors">
                  <div className="flex items-center justify-end gap-1.5">{t('transactions.table_amount')} <span className="text-[10px] text-slate-400">▼</span></div>
                </th>
                <th className="px-6 py-4 text-center">{t('transactions.table_proof')}</th>
                <th className="px-6 py-4 text-center">{t('transactions.table_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                      {formatDate(trx.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {trx.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${categoryColors[trx.category] || categoryColors["Lainnya"]}`}>
                        {trx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-2.5">
                        {trx.type === "Pemasukan" ? (
                          <FiArrowUpRight size={18} strokeWidth={3} className="text-emerald-500 shrink-0" />
                        ) : (
                          <FiArrowDownRight size={18} strokeWidth={3} className="text-rose-500 shrink-0" />
                        )}
                        <span className={`text-[15px] font-black tabular-nums tracking-tight ${trx.type === "Pemasukan" ? "text-emerald-600" : "text-slate-800"}`}>
                          {trx.type === "Pemasukan" ? "+" : "-"}{formatRupiah(trx.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {trx.invoice ? (
                        <button 
                          onClick={() => setViewingInvoice(trx)}
                          className="group flex items-center justify-center gap-1.5 mx-auto bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all shadow-sm" 
                          title={trx.invoice}
                        >
                          <FiPaperclip className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={14} />
                          <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">{t('transactions.view')}</span>
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(trx)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-indigo-500/30 active:scale-95"
                          title="Edit Transaksi"
                        >
                          <FiEdit2 size={15} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(trx.id)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-rose-500/30 active:scale-95"
                          title="Hapus Transaksi"
                        >
                          <FiTrash2 size={15} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">
                    {t('transactions.no_transactions')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Form Input Modal (Full Screen Premium) */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            
            {/* Modal Dialog (Full Screen Split Layout) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 20 }}
              className="fixed inset-4 md:inset-8 lg:inset-12 bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Side - Context/Illustration (Hidden on mobile) */}
              <div className="hidden md:flex flex-col justify-between w-[40%] max-w-sm bg-[#0B1120] p-10 relative overflow-hidden text-white border-r border-slate-100">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_top_right,#6366f1,transparent_50%)] pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/10 shadow-lg">
                    <FiPlus size={24} className="text-indigo-400" />
                  </div>
                  <h2 className="text-3xl font-black mb-5 tracking-tight leading-[1.1]">{editingId ? t('transactions.modal_edit_title') : t('transactions.modal_add_title')}<br/>{t('transactions.modal_smarter')}</h2>
                  <p className="text-slate-400 leading-relaxed font-medium text-sm">
                    {t('transactions.modal_ai_desc')}
                  </p>
                </div>
                
                <div className="relative z-10 p-5 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                       <FiZap className="text-amber-400 w-3 h-3" />
                     </div>
                     <h4 className="font-bold text-sm text-slate-200">{t('transactions.ai_tips_title')}</h4>
                   </div>
                   <p className="text-xs text-slate-400 leading-relaxed">{t('transactions.ai_tips_desc')}</p>
                </div>
              </div>

              {/* Right Side - Form Layout */}
              <div className="flex-1 flex flex-col h-full relative bg-slate-50/50">
                {/* Header */}
                <div className="px-6 md:px-10 py-6 flex items-center justify-between border-b border-slate-200 bg-white">
                  <h2 className="text-xl font-black text-slate-800 md:hidden">{editingId ? t('transactions.modal_edit_title') : t('transactions.modal_add_title')}</h2>
                  <div className="hidden md:block">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{editingId ? t('transactions.edit_data') : t('transactions.input_data')}</span>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {/* Form Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                  <div className="max-w-xl mx-auto space-y-8">
                    
                    {/* Input Tipe Transaksi (Besar & Jelas) */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('transactions.transaction_type')}</label>
                      <div className="relative flex p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 shadow-inner">
                        {["Pengeluaran", "Pemasukan"].map((type) => {
                          const isActive = formData.type === type;
                          const isExpense = type === "Pengeluaran";
                          return (
                            <button
                              key={type}
                              onClick={() => setFormData({...formData, type})}
                              className={`relative flex-1 py-3.5 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 z-10 ${
                                isActive 
                                  ? (isExpense ? "text-rose-700" : "text-emerald-700") 
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="active-type-tab"
                                  className={`absolute inset-0 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] ${
                                    isExpense ? "bg-white border border-rose-100" : "bg-white border border-emerald-100"
                                  }`}
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                              )}
                              <span className="relative z-10 flex items-center gap-2">
                                {isExpense ? (
                                  <FiArrowDownRight size={18} className={isActive ? "text-rose-500" : "opacity-60"} />
                                ) : (
                                  <FiArrowUpRight size={18} className={isActive ? "text-emerald-500" : "opacity-60"} />
                                )}
                                {isExpense ? t('transactions.expense') : t('transactions.income')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Input Nominal & Tanggal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('transactions.amount')}</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
                          <input 
                            type="number" 
                            placeholder="0"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-lg font-black text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('transactions.date')}</label>
                        <input 
                          type="date" 
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Input Keterangan & Smart AI Button */}
                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('transactions.transaction_desc')}</label>
                      </div>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder={t('transactions.desc_placeholder')}
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="w-full pl-4 pr-32 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                        />
                        {/* AI Magic Button inside input */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <button 
                            type="button"
                            onClick={handleAIPredict}
                            disabled={!formData.description || isAILoading}
                            className="group flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:grayscale shadow-sm"
                            title="Auto-Categorize dengan AI"
                          >
                            {isAILoading ? <FiLoader className="animate-spin text-white" /> : <FiZap className="text-amber-300" />}
                            <span className="hidden sm:inline">{t('transactions.ai_category')}</span>
                            <span className="sm:hidden">AI</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Input Kategori */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('transactions.category_label')}</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className={`w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer ${
                          isAILoading ? 'animate-pulse bg-indigo-50 border-indigo-200 shadow-inner' : ''
                        }`}
                      >
                        <option value="" disabled>{t('transactions.select_category')}</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Input Upload Invoice */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('transactions.invoice_proof')}</label>
                      <div 
                        className={`w-full border-2 border-dashed rounded-2xl p-6 transition-all ${
                          formData.invoiceFile 
                            ? "border-indigo-500 bg-indigo-50/50" 
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                        } flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden`}
                      >
                        <input 
                          type="file" 
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            if(e.target.files && e.target.files[0]) {
                              setFormData({...formData, invoiceFile: e.target.files[0]});
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        
                        {formData.invoiceFile ? (
                          <div className="flex flex-col items-center gap-2 relative z-0">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-500">
                              <FiPaperclip size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 line-clamp-1 px-4">{formData.invoiceFile.name}</p>
                              <p className="text-xs font-medium text-slate-500">{(formData.invoiceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                // Reset the file input value using ref or just clear state
                                setFormData({...formData, invoiceFile: null});
                              }}
                              className="mt-2 text-[10px] uppercase tracking-wider font-black text-rose-500 hover:text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full transition-colors relative z-20"
                            >
                              {t('transactions.remove_file')}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 pointer-events-none">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                              <FiUploadCloud size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">{t('transactions.drag_drop')}</p>
                              <p className="text-xs font-medium text-slate-500 mt-1">{t('transactions.support_format')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 md:px-10 md:py-6 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    {t('transactions.cancel')}
                  </button>
                  <button 
                    onClick={handleSaveTransaction}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-black hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 active:scale-95 flex items-center gap-2"
                  >
                    <span>{t('transactions.save_transaction')}</span>
                    <FiArrowUpRight size={18} className="opacity-80" />
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. Invoice Lightbox Modal */}
      <AnimatePresence>
        {viewingInvoice && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingInvoice(null)}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110]"
            />
            
            {/* Lightbox Dialog */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl bg-white rounded-3xl shadow-2xl z-[111] overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Left: Image/File Preview */}
              <div className="flex-1 bg-slate-100 flex items-center justify-center relative p-4 min-h-[300px]">
                {/* Decorative background for dummy data */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#6366f1,transparent_70%)] pointer-events-none"></div>
                
                {viewingInvoice.invoiceUrl ? (
                  // Show actual uploaded image
                  <img 
                    src={viewingInvoice.invoiceUrl} 
                    alt={viewingInvoice.invoice} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm relative z-10"
                  />
                ) : (
                  // Show beautiful dummy placeholder
                  <div className="bg-white p-8 rounded-2xl shadow-xl w-64 h-80 flex flex-col items-center justify-center text-center relative z-10 border border-slate-200">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-4">
                      <FiUploadCloud size={32} />
                    </div>
                    <p className="font-bold text-slate-800 break-words w-full px-2">{viewingInvoice.invoice}</p>
                    <p className="text-xs text-slate-400 mt-2">Mockup File Viewer</p>
                    <div className="mt-8 space-y-2 w-full px-4">
                      <div className="h-2 bg-slate-100 rounded-full w-full"></div>
                      <div className="h-2 bg-slate-100 rounded-full w-5/6 mx-auto"></div>
                      <div className="h-2 bg-slate-100 rounded-full w-4/6 mx-auto"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Transaction Details */}
              <div className="w-full md:w-80 bg-white p-8 flex flex-col border-l border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-slate-800">{t('transactions.invoice_detail')}</h3>
                  <button 
                    onClick={() => setViewingInvoice(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <div className="space-y-5 flex-1">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('transactions.file_name')}</p>
                    <p className="text-sm font-semibold text-slate-800 break-words">{viewingInvoice.invoice}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('transactions.transaction_desc')}</p>
                    <p className="text-sm font-semibold text-slate-800">{viewingInvoice.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('transactions.date')}</p>
                      <p className="text-sm font-semibold text-slate-800">{formatDate(viewingInvoice.date)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('transactions.table_amount')}</p>
                      <p className={`text-sm font-black ${viewingInvoice.type === 'Pemasukan' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {formatRupiah(viewingInvoice.amount)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('transactions.ai_category_status')}</p>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${categoryColors[viewingInvoice.category] || categoryColors["Lainnya"]}`}>
                      {viewingInvoice.category}
                    </span>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <button className="w-full py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                    <FiDownload size={16} />
                    {t('transactions.download_doc')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
