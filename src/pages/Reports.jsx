import { useState, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import {
  FiDownload, FiArrowUpRight, FiArrowDownRight, FiPieChart,
  FiTrendingUp, FiTrendingDown, FiZap, FiFileText, FiChevronDown
} from "react-icons/fi";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import jsPDF from "jspdf";
import "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- DYNAMIC DATA GENERATOR ---
const generateTransactions = (range) => {
  const now = new Date();
  const transactions = [];
  let id = 1;

  const incCats = ["Penjualan Produk", "Penjualan Jasa", "Pendapatan Lainnya"];
  const expCats = ["Bahan Baku", "Gaji Karyawan", "Operasional", "Pemasaran", "Sewa Tempat", "Peralatan"];

  const add = (date, desc, category, type, amount) => {
    transactions.push({ id: id++, date: date.toISOString().split('T')[0], description: desc, category, type, amount: Math.round(amount) });
  };

  if (range === "last_7_days") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const f = Math.sin(i * 0.8) * 0.3 + 1;
      add(d, "Penjualan Harian", incCats[i % 3], "Pemasukan", (900000 + i * 130000) * f);
      if (i % 2 === 0) add(d, "Belanja Operasional", expCats[i % 6], "Pengeluaran", (350000 + i * 60000) * f);
      if (i === 3) add(d, "Gaji Karyawan", "Gaji Karyawan", "Pengeluaran", 2500000);
      if (i === 5) add(d, "Jasa Konsultasi", "Penjualan Jasa", "Pemasukan", 1200000);
    }
  } else if (range === "this_month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    for (let i = 1; i <= Math.min(currentDay, daysInMonth); i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      const wave = Math.sin(i * 0.2) * 0.4 + 1;
      add(d, "Penjualan", incCats[i % 3], "Pemasukan", (650000 + i * 45000) * wave);
      if (i % 3 === 0) add(d, "Operasional", expCats[i % 6], "Pengeluaran", (220000 + i * 18000) * wave);
      if (i === 5) add(d, "Sewa Tempat", "Sewa Tempat", "Pengeluaran", 3500000);
      if (i === 12) add(d, "Gaji Karyawan", "Gaji Karyawan", "Pengeluaran", 2500000);
      if (i === 8) add(d, "Jasa Desain", "Penjualan Jasa", "Pemasukan", 2800000);
      if (i === 15) add(d, "Iklan Digital", "Pemasaran", "Pengeluaran", 750000);
    }
  } else if (range === "last_month") {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const daysInLM = new Date(lm.getFullYear(), lm.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInLM; i++) {
      const d = new Date(lm.getFullYear(), lm.getMonth(), i);
      const wave = Math.cos(i * 0.15) * 0.3 + 0.9;
      add(d, "Penjualan", incCats[i % 3], "Pemasukan", (520000 + i * 32000) * wave);
      if (i % 4 === 0) add(d, "Pengeluaran Rutin", expCats[i % 6], "Pengeluaran", (190000 + i * 14000) * wave);
      if (i === 10) add(d, "Sewa Tempat", "Sewa Tempat", "Pengeluaran", 3500000);
      if (i === 15) add(d, "Gaji Karyawan", "Gaji Karyawan", "Pengeluaran", 2500000);
      if (i === 20) add(d, "Jasa Katering", "Penjualan Jasa", "Pemasukan", 1800000);
    }
  } else if (range === "this_year") {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const currentMonth = now.getMonth();
    for (let m = 0; m <= currentMonth; m++) {
      const d = new Date(now.getFullYear(), m, 15);
      const growth = 1 + m * 0.05;
      const season = Math.sin(m * 0.5) * 0.2 + 1;
      add(d, `Penjualan ${monthNames[m]}`, incCats[m % 3], "Pemasukan", 8500000 * growth * season);
      add(d, `Jasa ${monthNames[m]}`, "Penjualan Jasa", "Pemasukan", 3200000 * growth * season);
      add(d, `Bahan Baku ${monthNames[m]}`, "Bahan Baku", "Pengeluaran", 2600000 * growth);
      add(d, `Gaji ${monthNames[m]}`, "Gaji Karyawan", "Pengeluaran", 2500000);
      add(d, `Operasional ${monthNames[m]}`, "Operasional", "Pengeluaran", 850000 * growth);
      if (m % 3 === 0) add(d, `Sewa ${monthNames[m]}`, "Sewa Tempat", "Pengeluaran", 3500000);
      if (m % 2 === 0) add(d, `Pemasaran ${monthNames[m]}`, "Pemasaran", "Pengeluaran", 550000 * growth);
    }
  }
  return transactions;
};

const categoryColors = {
  "Penjualan Produk": "#10b981",
  "Penjualan Jasa": "#14b8a6",
  "Pendapatan Lainnya": "#06b6d4",
  "Penjualan": "#10b981",
  "Bahan Baku": "#f59e0b",
  "Operasional": "#3b82f6",
  "Pemasaran": "#a855f7",
  "Gaji": "#f43f5e",
  "Gaji Karyawan": "#f43f5e",
  "Peralatan": "#64748b",
  "Sewa Tempat": "#6366f1",
  "Lainnya": "#9ca3af",
};

export default function Reports() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState("this_month");

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
  };

  // Dynamic transactions based on range
  const activeTransactions = useMemo(() => generateTransactions(dateRange), [dateRange]);

  // Metrics
  const metrics = useMemo(() => {
    let income = 0, expense = 0;
    activeTransactions.forEach(trx => {
      if (trx.type === "Pemasukan") income += trx.amount;
      else expense += trx.amount;
    });
    return { income, expense, balance: income - expense };
  }, [activeTransactions]);

  // Simulated trend comparison
  const trends = useMemo(() => {
    const map = {
      "last_7_days": { income: "+8.2%", expense: "+3.5%", incomeUp: true, expenseUp: true },
      "this_month": { income: "+12.5%", expense: "+3.2%", incomeUp: true, expenseUp: true },
      "last_month": { income: "-2.1%", expense: "+1.8%", incomeUp: false, expenseUp: true },
      "this_year": { income: "+32.5%", expense: "+18.0%", incomeUp: true, expenseUp: true },
    };
    return map[dateRange] || map["this_month"];
  }, [dateRange]);

  // Chart data grouped appropriately
  const cashFlowData = useMemo(() => {
    if (dateRange === "this_year") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
      const grouped = {};
      activeTransactions.forEach(trx => {
        const d = new Date(trx.date);
        const key = monthNames[d.getMonth()];
        if (!grouped[key]) grouped[key] = { date: key, Pemasukan: 0, Pengeluaran: 0, order: d.getMonth() };
        grouped[key][trx.type] += trx.amount;
      });
      return Object.values(grouped).sort((a, b) => a.order - b.order);
    } else {
      const grouped = {};
      activeTransactions.forEach(trx => {
        const d = new Date(trx.date);
        const label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!grouped[trx.date]) grouped[trx.date] = { date: label, Pemasukan: 0, Pengeluaran: 0, sortKey: trx.date };
        grouped[trx.date][trx.type] += trx.amount;
      });
      return Object.values(grouped).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }
  }, [activeTransactions, dateRange]);

  // Dynamic chart title
  const chartTitle = useMemo(() => {
    const titles = {
      "last_7_days": t('reports.daily_cashflow_7d'),
      "this_month": t('reports.daily_cashflow'),
      "last_month": t('reports.daily_cashflow_last'),
      "this_year": t('reports.monthly_cashflow'),
    };
    return titles[dateRange] || t('reports.daily_cashflow');
  }, [dateRange, t]);

  // Expense Pie data
  const expenseData = useMemo(() => {
    const grouped = {};
    activeTransactions.filter(tr => tr.type === "Pengeluaran").forEach(trx => {
      if (!grouped[trx.category]) grouped[trx.category] = 0;
      grouped[trx.category] += trx.amount;
    });
    return Object.keys(grouped).map(key => ({
      name: key,
      value: Math.round(grouped[key])
    })).sort((a, b) => b.value - a.value);
  }, [activeTransactions]);

  // AI Insights data
  const topExpense = expenseData.length > 0 ? expenseData[0] : null;
  const secondExpense = expenseData.length > 1 ? expenseData[1] : null;

  const topIncome = useMemo(() => {
    const grouped = {};
    activeTransactions.filter(tr => tr.type === "Pemasukan").forEach(trx => {
      if (!grouped[trx.category]) grouped[trx.category] = 0;
      grouped[trx.category] += trx.amount;
    });
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], value: sorted[0][1] } : null;
  }, [activeTransactions]);

  // Profit margin percentage
  const profitMargin = metrics.income > 0 ? ((metrics.balance / metrics.income) * 100).toFixed(1) : "0";

  // --- EXPORT FUNCTIONS ---
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Keuangan');

    worksheet.columns = [
      { header: '', key: 'akun', width: 40 },
      { header: '', key: 'catatan', width: 15 },
      { header: '', key: 'nominal1', width: 25 },
      { header: '', key: 'nominal2', width: 25 }
    ];

    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'UMKM ARTHA';
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:D2');
    worksheet.getCell('A2').value = 'Laporan Keuangan';
    worksheet.getCell('A2').font = { bold: true, size: 12 };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:D3');
    worksheet.getCell('A3').value = `Periode: ${dateRange}`;
    worksheet.getCell('A3').font = { bold: true, size: 11 };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    const headerRow = worksheet.addRow(['Keterangan', 'Catatan', 'Sub Total', 'Total']);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
      cell.alignment = { horizontal: 'center' };
    });

    const addRowWithBorder = (data, isBold = false) => {
      const row = worksheet.addRow(data);
      if (isBold) row.font = { bold: true };
      row.eachCell((cell, colNumber) => {
        if (colNumber === 1 || colNumber === 3 || colNumber === 4) {
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
          };
        }
      });
      return row;
    };

    addRowWithBorder(['PEMASUKAN', '', '', ''], true);
    const pemasukanKategori = {};
    activeTransactions.filter(tr => tr.type === 'Pemasukan').forEach(tr => {
      if (!pemasukanKategori[tr.category]) pemasukanKategori[tr.category] = 0;
      pemasukanKategori[tr.category] += tr.amount;
    });
    Object.entries(pemasukanKategori).forEach(([kategori, total]) => {
      addRowWithBorder([kategori, '', total, '']);
    });

    const totalPemasukanRow = worksheet.addRow(['Jumlah Pemasukan', '', '', metrics.income]);
    totalPemasukanRow.font = { bold: true };
    totalPemasukanRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA9D08E' } };
    totalPemasukanRow.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
    });

    worksheet.addRow([]);

    addRowWithBorder(['PENGELUARAN', '', '', ''], true);
    const pengeluaranKategori = {};
    activeTransactions.filter(tr => tr.type === 'Pengeluaran').forEach(tr => {
      if (!pengeluaranKategori[tr.category]) pengeluaranKategori[tr.category] = 0;
      pengeluaranKategori[tr.category] += tr.amount;
    });
    Object.entries(pengeluaranKategori).forEach(([kategori, total]) => {
      addRowWithBorder([kategori, '', total, '']);
    });

    const totalPengeluaranRow = worksheet.addRow(['Jumlah Pengeluaran', '', '', metrics.expense]);
    totalPengeluaranRow.font = { bold: true };
    totalPengeluaranRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA9D08E' } };
    totalPengeluaranRow.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
    });

    worksheet.addRow([]);

    const labaBersihRow = worksheet.addRow(['LABA BERSIH', '', '', metrics.balance]);
    labaBersihRow.font = { bold: true, size: 12 };
    labaBersihRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA9D08E' } };
    labaBersihRow.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
    });

    worksheet.getColumn(3).numFmt = '"Rp "* #,##0;"Rp "* -#,##0;"Rp "* "-"';
    worksheet.getColumn(4).numFmt = '"Rp "* #,##0;"Rp "* -#,##0;"Rp "* "-"';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Laporan_Keuangan_${dateRange}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Laporan Keuangan UMKM", 14, 22);
    doc.setFontSize(11);
    doc.text(`Periode: ${dateRange}`, 14, 30);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 36);

    doc.setFontSize(12);
    doc.text(`Total Pemasukan: ${formatRupiah(metrics.income)}`, 14, 48);
    doc.text(`Total Pengeluaran: ${formatRupiah(metrics.expense)}`, 14, 55);
    doc.text(`Laba Bersih: ${formatRupiah(metrics.balance)}`, 14, 62);

    const tableColumn = ["Tanggal", "Keterangan", "Kategori", "Tipe", "Nominal"];
    const tableRows = activeTransactions.map(trx => [
      trx.date, trx.description, trx.category, trx.type, formatRupiah(trx.amount)
    ]);

    doc.autoTable({
      startY: 70,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`Laporan_Keuangan_${dateRange}.pdf`);
  };

  // Range label map for display
  const rangeLabels = {
    "this_month": t('reports.this_month'),
    "last_month": t('reports.last_month'),
    "last_7_days": t('reports.last_7_days'),
    "this_year": t('reports.this_year'),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">

      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800">{t('reports.title')}</h1>
          <p className="text-slate-500 font-medium mt-1">{t('reports.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer shadow-sm appearance-none"
            >
              <option value="this_month">{t('reports.this_month')}</option>
              <option value="last_month">{t('reports.last_month')}</option>
              <option value="last_7_days">{t('reports.last_7_days')}</option>
              <option value="this_year">{t('reports.this_year')}</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <FiFileText />
            <span className="hidden sm:inline">{t('reports.export_excel')}</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
          >
            <FiDownload size={16} />
            <span className="hidden sm:inline">{t('reports.download_pdf')}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-500 mb-1">{t('reports.total_income')}</p>
            <h3 className="text-3xl font-black text-emerald-600 mb-2">{formatRupiah(metrics.income)}</h3>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${trends.incomeUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} w-fit px-2 py-1 rounded-md`}>
              {trends.incomeUp ? <FiTrendingUp /> : <FiTrendingDown />}
              <span>{trends.income} {t('reports.vs_last_month')}</span>
            </div>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] text-emerald-50 opacity-50 pointer-events-none">
            <FiArrowUpRight size={120} strokeWidth={3} />
          </div>
        </div>

        {/* Expense */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-500 mb-1">{t('reports.total_expense')}</p>
            <h3 className="text-3xl font-black text-rose-600 mb-2">{formatRupiah(metrics.expense)}</h3>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${trends.expenseUp ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'} w-fit px-2 py-1 rounded-md`}>
              {trends.expenseUp ? <FiTrendingUp /> : <FiTrendingDown />}
              <span>{trends.expense} {t('reports.vs_last_month')}</span>
            </div>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] text-rose-50 opacity-50 pointer-events-none">
            <FiArrowDownRight size={120} strokeWidth={3} />
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden text-white border border-indigo-500">
          <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_top_right,#fff,transparent_60%)] pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-indigo-100 mb-1">{t('reports.net_profit')}</p>
            <h3 className="text-3xl font-black mb-2">{formatRupiah(metrics.balance)}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-indigo-200">{t('reports.profit_margin')}: {profitMargin}%</span>
              <span className="text-xs font-medium text-indigo-200 bg-white/10 px-2 py-0.5 rounded-md">
                {metrics.balance >= 0 ? t('reports.condition_healthy') : t('reports.condition_warning')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. AI Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <FiZap size={16} />
          </div>
          <h3 className="text-lg font-black text-slate-800">{t('reports.ai_insights')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/60 p-4 rounded-xl border border-white shadow-sm">
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              {topExpense && secondExpense ? (
                <>
                  {t('reports.insight_expense_prefix')}{' '}
                  <span className="font-bold text-rose-600">{topExpense.name}</span> ({formatRupiah(topExpense.value)})
                  {' '}{t('reports.insight_and')}{' '}
                  <span className="font-bold text-amber-600">{secondExpense.name}</span> ({formatRupiah(secondExpense.value)}).
                </>
              ) : t('reports.insight_no_data')}
            </p>
          </div>
          <div className="bg-white/60 p-4 rounded-xl border border-white shadow-sm">
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              {metrics.balance >= 0 ? (
                <>
                  {t('reports.insight_positive')}{' '}
                  {topIncome && (
                    <>
                      {t('reports.insight_top_income')}{' '}
                      <span className="font-bold text-emerald-600">{topIncome.name}</span>{' '}
                      ({formatRupiah(topIncome.value)}).
                    </>
                  )}
                </>
              ) : (
                <span className="text-rose-600 font-bold">{t('reports.insight_negative')}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cash Flow Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800">{chartTitle}</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{rangeLabels[dateRange]}</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} interval={dateRange === "this_month" || dateRange === "last_month" ? 4 : 0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => dateRange === "this_year" ? `${(v / 1000000).toFixed(0)}jt` : `${(v / 1000).toFixed(0)}k`} />
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <RechartsTooltip
                  formatter={(value) => formatRupiah(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPemasukan)" />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorPengeluaran)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Distribution Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black text-slate-800">{t('reports.expense_distribution')}</h3>
            <FiPieChart className="text-slate-400" />
          </div>
          <div className="flex-1 flex flex-col justify-center relative min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || categoryColors["Lainnya"]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value) => formatRupiah(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Custom inner text for donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-slate-400">{t('reports.total')}</span>
              <span className="text-sm font-black text-slate-800">{formatRupiah(metrics.expense)}</span>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {expenseData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[item.name] || categoryColors["Lainnya"] }}></div>
                  <span className="font-semibold text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
