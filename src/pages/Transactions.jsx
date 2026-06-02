import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import imageCompression from 'browser-image-compression';
import transactionService from "../services/transactionService";
import {
  FiPlus, FiSearch, FiFilter, FiDownload, FiMoreVertical,
  FiArrowUpRight, FiArrowDownRight, FiX, FiZap, FiLoader,
  FiUploadCloud, FiPaperclip, FiEdit2, FiTrash2, FiChevronDown,
  FiAlertCircle, FiRefreshCw, FiCalendar, FiCheckCircle, FiCircle
} from "react-icons/fi";

// --- FUNGSI HELPER ROLE ---
const getCurrentUserRole = () => {
  try {
    const profile = JSON.parse(localStorage.getItem("profile") || "{}");
    if (profile.role) return profile.role.toUpperCase();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return (user.user_metadata?.role || "USER").toUpperCase();
  } catch (e) { return "USER"; }
};

const categories = [
  "Penjualan", "Bahan Baku", "Operasional", "Pemasaran", "Gaji", "Peralatan", "Lainnya"
];

const expenseCategories = [
  "Bahan Baku", "Gaji Karyawan", "Operasional", "Pemasaran", "Sewa Tempat", "Peralatan", "Lainnya"
];

const incomeCategories = [
  "Penjualan Produk", "Penjualan Jasa", "Pendapatan Lainnya"
];

const categoryColors = {
  "Penjualan": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Penjualan Produk": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Penjualan Jasa": "bg-teal-100 text-teal-700 border-teal-200",
  "Pendapatan Lainnya": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Bahan Baku": "bg-amber-100 text-amber-700 border-amber-200",
  "Operasional": "bg-blue-100 text-blue-700 border-blue-200",
  "Pemasaran": "bg-purple-100 text-purple-700 border-purple-200",
  "Gaji": "bg-rose-100 text-rose-700 border-rose-200",
  "Gaji Karyawan": "bg-rose-100 text-rose-700 border-rose-200",
  "Peralatan": "bg-slate-100 text-slate-700 border-slate-200",
  "Sewa Tempat": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Lainnya": "bg-gray-100 text-gray-700 border-gray-200",
};

export default function Transactions({ isDashboard = false }) {
  const { t } = useTranslation();

  // --- KONFIGURASI AKSES ---
  const role = getCurrentUserRole();
  const canModify = role === "OWNER" || role === "ADMIN"; // Admin & Owner boleh tambah/hapus

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const ITEMS_PER_PAGE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isCompressing, setIsCompressing] = useState(false);

  const [formData, setFormData] = useState({
    type: "Pengeluaran",
    amount: "",
    displayAmount: "",
    date: new Date().toISOString().split('T')[0],
    category: "",
    description: "",
    invoiceFile: null,
  });

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const res = await transactionService.getTransactions();
      const data = res.data?.data || res.data || [];
      const normalized = (Array.isArray(data) ? data : []).map(trx => ({
        id: trx.id || trx._id,
        date: trx.date || trx.transaction_date || trx.created_at?.split('T')[0],
        description: trx.description || trx.keterangan || "-",
        category: trx.category || trx.kategori || "Lainnya",
        type: trx.type || trx.tipe || (trx.amount >= 0 ? "Pemasukan" : "Pengeluaran"),
        amount: Math.abs(Number(trx.amount || trx.nominal || 0)),
        invoice: trx.invoice || trx.bukti || null,
        invoiceUrl: trx.invoice_url || trx.bukti_url || null,
        is_checked: trx.is_checked || JSON.parse(localStorage.getItem(`checked_trx_${trx.id || trx._id}`)) || false,
      }));
      setTransactions(normalized);
    } catch (err) {
      setApiError(err.response?.data?.message || "Gagal memuat transaksi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // Auto-format currency helper
  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const display = raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : "";
    setFormData({ ...formData, amount: raw, displayAmount: display });
    if (raw) setFormErrors(prev => ({ ...prev, amount: undefined }));
  };

  // Dynamic categories based on type
  const activeCategoryList = formData.type === "Pemasukan" ? incomeCategories : expenseCategories;

  // Handle type change and reset category
  const handleTypeChange = (type) => {
    setFormData({ ...formData, type, category: "" });
  };

  // Handle file upload with compression
  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setIsCompressing(true);
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          setFormData(prev => ({ ...prev, invoiceFile: compressedFile }));
        } catch (error) {
          console.error('Compression failed, using original:', error);
          setFormData(prev => ({ ...prev, invoiceFile: file }));
        } finally {
          setIsCompressing(false);
        }
      } else {
        setFormData({ ...formData, invoiceFile: file });
      }
    }
  };

  // --- CALCULATION LOGIC ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      const matchSearch = trx.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === "Semua" || trx.category === filterCategory;
      const matchType = filterType === "Semua" || trx.type === filterType;
      const matchDate = filterDate ? trx.date === filterDate : true;
      return matchSearch && matchCategory && matchType && matchDate;
    });
  }, [searchTerm, filterCategory, filterType, filterDate, transactions]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    } else if (filteredTransactions.length > 0 && currentPage === 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage, filteredTransactions.length]);

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
  const handleSelectAll = (e) => {
    const pageIds = paginatedTransactions.map(trx => trx.id);
    if (e.target.checked) {
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      setSelectedIds(selectedIds.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(t('transactions.confirm_bulk_delete', { count: selectedIds.length }))) {
      try {
        await Promise.all(selectedIds.map(id => transactionService.deleteTransaction(id)));
        setSelectedIds([]);
        await fetchTransactions();
      } catch (err) {
        console.error("Gagal bulk delete:", err);
        alert("Gagal menghapus beberapa transaksi: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }
    const headers = ["Tanggal", "Deskripsi", "Kategori", "Tipe", "Nominal", "Status Cek"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(trx => [
        trx.date,
        `"${trx.description}"`,
        trx.category,
        trx.type,
        trx.amount,
        trx.is_checked ? "Sudah Dicek" : "Belum Dicek"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Transaksi_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleCheck = (id) => {
    setTransactions(prev => prev.map(trx => {
      if (trx.id === id) {
        const newStatus = !trx.is_checked;
        localStorage.setItem(`checked_trx_${id}`, JSON.stringify(newStatus));
        return { ...trx, is_checked: newStatus };
      }
      return trx;
    }));
  };

  const handleEditClick = (trx) => {
    setEditingId(trx.id);
    const rawAmount = trx.amount.toString();
    setFormData({
      type: trx.type,
      amount: rawAmount,
      displayAmount: new Intl.NumberFormat('id-ID').format(Number(rawAmount)),
      date: trx.date,
      category: trx.category,
      description: trx.description,
      invoiceFile: null,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm(t('transactions.confirm_delete'))) {
      try {
        await transactionService.deleteTransaction(id);
        await fetchTransactions();
      } catch (err) {
        console.error("Gagal hapus transaksi:", err);
        alert("Gagal menghapus transaksi: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSaveTransaction = async () => {
    // 1. Validasi Input
    const errors = {};
    if (!formData.amount) errors.amount = t('transactions.error_amount');
    if (!formData.date) errors.date = t('transactions.error_date');
    if (!formData.category) errors.category = t('transactions.error_category');

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSaving(true);

    try {
      // Sesuai dokumentasi API Arta:
      // POST /transactions → Multipart/Form-Data
      // Fields: type, amount, date, description, category, invoiceFile (opsional)
      const submitData = new FormData();
      submitData.append('type', formData.type);                          // "Pemasukan" atau "Pengeluaran"
      submitData.append('amount', Math.abs(Number(formData.amount)));    // Angka positif (contoh: 150000)
      submitData.append('date', formData.date);                          // Format YYYY-MM-DD
      submitData.append('description', formData.description || '-');     // Keterangan detail
      submitData.append('category', formData.category);                  // Kategori transaksi (sinkron dengan input user)

      // File invoice opsional (key harus 'invoiceFile' sesuai docs)
      if (formData.invoiceFile) {
        // [WORKAROUND] Nonaktifkan upload file sementara karena bucket "bukti_transaksi" belum ada di backend Vercel
        // submitData.append('invoiceFile', formData.invoiceFile);
        alert("Pemberitahuan: Fitur upload invoice sedang dalam pemeliharaan (bucket not found). Transaksi akan disimpan tanpa lampiran gambar.");
      }

      // Kirim ke Backend
      if (editingId) {
        await transactionService.updateTransaction(editingId, submitData);
      } else {
        await transactionService.createTransaction(submitData);
      }

      // 5. Sukses -> Tutup modal dan reset
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        type: "Pengeluaran",
        amount: "",
        displayAmount: "",
        date: new Date().toISOString().split('T')[0],
        category: "",
        description: "",
        invoiceFile: null,
      });

      // Refresh data di tabel
      await fetchTransactions();

    } catch (err) {
      console.error("Gagal simpan transaksi:", err);
      // Tangkap pesan error dari backend
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message;
      alert("Gagal menyimpan transaksi: " + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <FiLoader size={32} className="text-blue-500 animate-spin" />
            <p className="text-slate-500 font-medium">Memuat data transaksi...</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {apiError && !isLoading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="text-rose-500 shrink-0" size={20} />
              <p className="text-sm font-semibold text-rose-700">{apiError}</p>
            </div>
            <button onClick={fetchTransactions} className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors shrink-0">
              <FiRefreshCw size={14} /> Coba Lagi
            </button>
          </div>

          {(apiError.toLowerCase().includes('entitas bisnis') || apiError.toLowerCase().includes('business')) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-amber-800">Akun Anda belum memiliki entitas bisnis.</p>
                <p className="text-xs text-amber-600 mt-1">Klik tombol di samping untuk mencoba mengaktifkan bisnis secara otomatis.</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    const response = await fetch("https://arta-backend-nine.vercel.app/api/profile/onboarding", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                      body: JSON.stringify({ user_type: "umkm_aktif", nama_usaha: "Usaha Saya", tipe_usaha: "Umum", lama_usaha: "< 1 Tahun" })
                    });
                    const resData = await response.json();
                    if (!response.ok) throw new Error(resData.message || "Gagal mengaktifkan bisnis");
                    alert('✅ Bisnis berhasil diaktifkan! Halaman akan dimuat ulang.');
                    if (resData.data?.profile) localStorage.setItem('profile', JSON.stringify(resData.data.profile));
                    window.location.reload();
                  } catch (err) {
                    console.error('Gagal aktivasi bisnis:', err);
                    alert('❌ Gagal mengaktifkan bisnis: ' + err.message);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shrink-0 shadow-sm active:scale-95"
              >
                <FiRefreshCw size={14} /> Aktivasi Bisnis
              </button>
            </div>
          )}
        </div>
      )}

      {/* 1. Header & Panel Metrik */}
      {!isLoading && !isDashboard && (
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-6">{t('transactions.title')}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">{t('transactions.income_this_month')}</p>
                <h3 className="text-2xl font-black text-emerald-600">{formatRupiah(metrics.income)}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">{t('transactions.expense_this_month')}</p>
                <h3 className="text-2xl font-black text-rose-600">{formatRupiah(metrics.expense)}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">{t('transactions.net_cash_flow')}</p>
                <h3 className={`text-2xl font-black ${metrics.balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                  {metrics.balance >= 0 ? '+' : ''}{formatRupiah(metrics.balance)}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Toolbar */}
      {!isLoading && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 flex-col lg:flex-row gap-3 w-full">
            <div className="relative w-full lg:flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder={t('transactions.search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
            </div>
            {/* ... filter elements ... */}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {canModify && selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors shadow-sm">
                <FiTrash2 /> <span>{t('transactions.bulk_delete', { count: selectedIds.length })}</span>
              </button>
            )}
            <button onClick={handleExportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
              <FiDownload /> <span>{t('transactions.export_csv')}</span>
            </button>
            {canModify && (
              <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all active:scale-95">
                <FiPlus size={18} /> <span>{t('transactions.add_transaction')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Data Table */}
      {!isLoading && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={paginatedTransactions.length > 0 && paginatedTransactions.every(trx => selectedIds.includes(trx.id))} /></th>
                  <th className="px-6 py-4">{t('transactions.table_date')}</th>
                  <th className="px-6 py-4">{t('transactions.table_desc')}</th>
                  <th className="px-6 py-4">{t('transactions.table_category')}</th>
                  <th className="px-6 py-4 text-right">{t('transactions.table_amount')}</th>
                  <th className="px-6 py-4 text-center">{t('transactions.table_proof')}</th>
                  <th className="px-6 py-4 text-center">Status Cek</th>
                  <th className="px-6 py-4 text-center">{t('transactions.table_action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.includes(trx.id)} onChange={() => handleSelectOne(trx.id)} /></td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDate(trx.date)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{trx.description}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${categoryColors[trx.category] || categoryColors["Lainnya"]}`}>{trx.category}</span></td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[15px] font-black ${trx.type === "Pemasukan" ? "text-emerald-600" : "text-rose-600"}`}>
                        {trx.type === "Pemasukan" ? "+" : "-"}{formatRupiah(trx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">{trx.invoice ? <button onClick={() => setViewingInvoice(trx)} className="text-indigo-600">Lihat</button> : "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggleCheck(trx.id)} className={`px-3 py-1.5 rounded-lg ${trx.is_checked ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                        {trx.is_checked ? "Dicek" : "Belum"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {canModify ? (
                          <>
                            <button onClick={() => handleEditClick(trx)} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-all"><FiEdit2 size={15} /></button>
                            <button onClick={() => handleDeleteTransaction(trx.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all"><FiTrash2 size={15} /></button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">Read-only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">
              {t('transactions.showing_data', {
                start: filteredTransactions.length > 0 ? Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredTransactions.length) : 0,
                end: Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length),
                total: filteredTransactions.length
              })}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-95"
              >
                {t('transactions.pagination_prev')}
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-95"
              >
                {t('transactions.pagination_next')}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <h2 className="text-3xl font-black mb-5 tracking-tight leading-[1.1]">{editingId ? t('transactions.modal_edit_title') : t('transactions.modal_add_title')}<br /><span className="text-indigo-400">{t('transactions.modal_smarter_new')}</span></h2>
                  <p className="text-slate-400 leading-relaxed font-medium text-sm">
                    {t('transactions.modal_ai_desc_new')}
                  </p>
                </div>

                <div className="relative z-10 p-5 bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <FiZap className="text-indigo-400 w-3 h-3" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-200">{t('transactions.ai_tips_title_new')}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{t('transactions.ai_tips_desc_new')}</p>
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
                              onClick={() => handleTypeChange(type)}
                              className={`relative flex-1 py-3.5 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 z-10 ${isActive
                                ? (isExpense ? "text-rose-700" : "text-emerald-700")
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="active-type-tab"
                                  className={`absolute inset-0 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] ${isExpense ? "bg-white border border-rose-100" : "bg-white border border-emerald-100"
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
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('transactions.amount')} <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={formData.displayAmount}
                            onChange={handleAmountChange}
                            className={`w-full pl-12 pr-4 py-4 bg-white border rounded-2xl text-lg font-black text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none ${formErrors.amount ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'}`}
                          />
                        </div>
                        {formErrors.amount && <p className="text-xs font-bold text-rose-500 mt-1 flex items-center gap-1">⚠ {formErrors.amount}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('transactions.date')} <span className="text-rose-500">*</span></label>
                        <input
                          type="date"
                          value={formData.date}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            setFormData({ ...formData, date: e.target.value });
                            if (e.target.value) setFormErrors(prev => ({ ...prev, date: undefined }));
                          }}
                          className={`w-full px-4 py-4 bg-white border rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none ${formErrors.date ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'}`}
                        />
                        {formErrors.date && <p className="text-xs font-bold text-rose-500 mt-1 flex items-center gap-1">⚠ {formErrors.date}</p>}
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
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Input Kategori */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {t('transactions.category_label')} <span className="text-rose-500">*</span>
                      </label>

                      {/* Tambahkan div relative sebagai wrapper */}
                      <div className="relative">
                        <select
                          value={formData.category}
                          onChange={(e) => {
                            setFormData({ ...formData, category: e.target.value });
                            if (e.target.value) setFormErrors(prev => ({ ...prev, category: undefined }));
                          }}
                          // Tambahkan pr-12 (padding-right) agar teks tidak menabrak ikon
                          className={`w-full px-4 py-4 pr-12 bg-white border rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer ${formErrors.category ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-200'}`}
                        >
                          <option value="" disabled>{t('transactions.select_category')}</option>
                          {activeCategoryList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {/* Ikon dropdown buatan sendiri */}
                        <FiChevronDown
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={20}
                        />
                      </div>

                      {formErrors.category && (
                        <p className="text-xs font-bold text-rose-500 mt-1 flex items-center gap-1">
                          ⚠ {formErrors.category}
                        </p>
                      )}
                    </div>

                    {/* Input Upload Invoice */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('transactions.invoice_proof')}</label>
                      <div
                        className={`w-full border-2 border-dashed rounded-2xl p-6 transition-all ${formData.invoiceFile
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                          } flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden`}
                      >
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        {isCompressing ? (
                          <div className="flex flex-col items-center gap-2 pointer-events-none">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-500 animate-pulse">
                              <FiLoader size={24} className="animate-spin" />
                            </div>
                            <p className="text-sm font-bold text-slate-700">{t('transactions.compressing_image')}</p>
                          </div>
                        ) : formData.invoiceFile ? (
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
                                setFormData({ ...formData, invoiceFile: null });
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
                    disabled={isSaving}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-black hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <FiLoader size={18} className="animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <span>{t('transactions.save_transaction')}</span>
                        <FiArrowUpRight size={18} className="opacity-80" />
                      </>
                    )}
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