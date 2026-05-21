import { useState, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { 
  FiDownload, FiArrowUpRight, FiArrowDownRight, FiPieChart, 
  FiTrendingUp, FiZap, FiFileText
} from "react-icons/fi";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import jsPDF from "jspdf";
import "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- DUMMY DATA ---
const dummyTransactions = [
  { id: 1, date: "2026-05-01", description: "Penjualan A", category: "Penjualan", type: "Pemasukan", amount: 1500000 },
  { id: 2, date: "2026-05-02", description: "Beli bahan baku", category: "Bahan Baku", type: "Pengeluaran", amount: 450000 },
  { id: 3, date: "2026-05-05", description: "Bayar listrik", category: "Operasional", type: "Pengeluaran", amount: 200000 },
  { id: 4, date: "2026-05-08", description: "Penjualan B", category: "Penjualan", type: "Pemasukan", amount: 3200000 },
  { id: 5, date: "2026-05-10", description: "Iklan FB", category: "Pemasaran", type: "Pengeluaran", amount: 150000 },
  { id: 6, date: "2026-05-11", description: "Servis alat", category: "Peralatan", type: "Pengeluaran", amount: 350000 },
  { id: 7, date: "2026-05-12", description: "Gaji Karyawan", category: "Gaji", type: "Pengeluaran", amount: 2500000 },
  { id: 8, date: "2026-05-13", description: "Penjualan C", category: "Penjualan", type: "Pemasukan", amount: 2100000 },
  { id: 9, date: "2026-05-14", description: "Lainnya", category: "Lainnya", type: "Pengeluaran", amount: 50000 },
];

const categoryColors = {
  "Penjualan": "#10b981", // emerald-500
  "Bahan Baku": "#f59e0b", // amber-500
  "Operasional": "#3b82f6", // blue-500
  "Pemasaran": "#a855f7", // purple-500
  "Gaji": "#f43f5e", // rose-500
  "Peralatan": "#64748b", // slate-500
  "Lainnya": "#9ca3af", // gray-400
};

export default function Reports() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState("This Month");

  // Format currency
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    dummyTransactions.forEach(trx => {
      if (trx.type === "Pemasukan") income += trx.amount;
      else if (trx.type === "Pengeluaran") expense += trx.amount;
    });
    return { income, expense, balance: income - expense };
  }, []);

  // Prepare data for Cash Flow Chart (Group by Date)
  const cashFlowData = useMemo(() => {
    const grouped = {};
    dummyTransactions.forEach(trx => {
      const date = trx.date;
      if (!grouped[date]) grouped[date] = { date, Pemasukan: 0, Pengeluaran: 0 };
      grouped[date][trx.type] += trx.amount;
    });
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, []);

  // Prepare data for Expense Pie Chart
  const expenseData = useMemo(() => {
    const grouped = {};
    dummyTransactions.filter(t => t.type === "Pengeluaran").forEach(trx => {
      if (!grouped[trx.category]) grouped[trx.category] = 0;
      grouped[trx.category] += trx.amount;
    });
    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key]
    })).sort((a, b) => b.value - a.value); // Sort desc
  }, []);

  // --- EXPORT FUNCTIONS ---
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Keuangan');

    // Kolom
    worksheet.columns = [
      { header: '', key: 'akun', width: 40 },
      { header: '', key: 'catatan', width: 15 },
      { header: '', key: 'nominal1', width: 25 },
      { header: '', key: 'nominal2', width: 25 }
    ];

    // --- Judul ---
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
    
    worksheet.addRow([]); // Blank row

    // --- Header Tabel ---
    const headerRow = worksheet.addRow(['Keterangan', 'Catatan', 'Sub Total', 'Total']);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'double' }
      };
      cell.alignment = { horizontal: 'center' };
    });

    // Helper border
    const addRowWithBorder = (data, isBold = false) => {
      const row = worksheet.addRow(data);
      if (isBold) row.font = { bold: true };
      row.eachCell((cell, colNumber) => {
        if(colNumber === 1 || colNumber === 3 || colNumber === 4) {
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
            right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
          };
        }
      });
      return row;
    };

    // --- PEMASUKAN ---
    addRowWithBorder(['PEMASUKAN', '', '', ''], true);
    
    const pemasukanKategori = {};
    dummyTransactions.filter(t => t.type === 'Pemasukan').forEach(t => {
      if (!pemasukanKategori[t.category]) pemasukanKategori[t.category] = 0;
      pemasukanKategori[t.category] += t.amount;
    });

    Object.entries(pemasukanKategori).forEach(([kategori, total]) => {
      addRowWithBorder([kategori, '', total, '']);
    });

    // Total Pemasukan
    const totalPemasukanRow = worksheet.addRow(['Jumlah Pemasukan', '', '', metrics.income]);
    totalPemasukanRow.font = { bold: true };
    totalPemasukanRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA9D08E' } // Green background
    };
    totalPemasukanRow.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
    });

    worksheet.addRow([]);

    // --- PENGELUARAN ---
    addRowWithBorder(['PENGELUARAN', '', '', ''], true);
    
    const pengeluaranKategori = {};
    dummyTransactions.filter(t => t.type === 'Pengeluaran').forEach(t => {
      if (!pengeluaranKategori[t.category]) pengeluaranKategori[t.category] = 0;
      pengeluaranKategori[t.category] += t.amount;
    });

    Object.entries(pengeluaranKategori).forEach(([kategori, total]) => {
      addRowWithBorder([kategori, '', total, '']);
    });

    // Total Pengeluaran
    const totalPengeluaranRow = worksheet.addRow(['Jumlah Pengeluaran', '', '', metrics.expense]);
    totalPengeluaranRow.font = { bold: true };
    totalPengeluaranRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA9D08E' } // Green background
    };
    totalPengeluaranRow.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
    });

    worksheet.addRow([]);

    // --- LABA BERSIH ---
    const labaBersihRow = worksheet.addRow(['LABA BERSIH', '', '', metrics.balance]);
    labaBersihRow.font = { bold: true, size: 12 };
    labaBersihRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA9D08E' } // Green background
    };
    labaBersihRow.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'double' } };
    });

    // Format mata uang
    worksheet.getColumn(3).numFmt = '"Rp "* #,##0;"Rp "* -#,##0;"Rp "* "-"';
    worksheet.getColumn(4).numFmt = '"Rp "* #,##0;"Rp "* -#,##0;"Rp "* "-"';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Laporan_Keuangan_${dateRange.replace(/ /g, '_')}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Laporan Keuangan UMKM", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Periode: ${dateRange}`, 14, 30);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 36);
    
    // Summary Metrics
    doc.setFontSize(12);
    doc.text(`Total Pemasukan: ${formatRupiah(metrics.income)}`, 14, 48);
    doc.text(`Total Pengeluaran: ${formatRupiah(metrics.expense)}`, 14, 55);
    doc.text(`Laba Bersih: ${formatRupiah(metrics.balance)}`, 14, 62);

    // Table
    const tableColumn = ["Tanggal", "Keterangan", "Kategori", "Tipe", "Nominal"];
    const tableRows = [];

    dummyTransactions.forEach(trx => {
      const transactionData = [
        trx.date,
        trx.description,
        trx.category,
        trx.type,
        formatRupiah(trx.amount)
      ];
      tableRows.push(transactionData);
    });

    doc.autoTable({
      startY: 70,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
    });

    doc.save(`Laporan_Keuangan_${dateRange.replace(" ", "_")}.pdf`);
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
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer shadow-sm"
          >
            <option value="This Month">{t('reports.this_month')}</option>
            <option value="Last Month">Bulan Lalu</option>
            <option value="Last 7 Days">7 Hari Terakhir</option>
            <option value="This Year">Tahun Ini</option>
          </select>

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
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
              <FiTrendingUp />
              <span>+12.5% {t('reports.vs_last_month')}</span>
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
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 w-fit px-2 py-1 rounded-md">
              <FiTrendingUp />
              <span>+3.2% {t('reports.vs_last_month')}</span>
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
            <p className="text-xs font-medium text-indigo-200">{t('reports.condition_healthy')}</p>
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
              <Trans i18nKey="reports.insight_1">
                Pengeluaran terbesar bulan ini berada pada kategori <span className="font-bold text-rose-600">Gaji</span> dan <span className="font-bold text-amber-600">Bahan Baku</span>.
              </Trans>
            </p>
          </div>
          <div className="bg-white/60 p-4 rounded-xl border border-white shadow-sm">
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              <Trans i18nKey="reports.insight_2">
                Arus kas berjalan positif. Penjualan mengalami peningkatan signifikan pada tanggal <span className="font-bold text-emerald-600">08 Mei</span> sebesar Rp 3.200.000.
              </Trans>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cash Flow Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800">{t('reports.daily_cashflow')}</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => `Rp ${value/1000}k`} />
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <RechartsTooltip 
                  formatter={(value) => formatRupiah(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}/>
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
