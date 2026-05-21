import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ID: {
    translation: {
      // Layout
      "menu": {
        "dashboard": "Dashboard",
        "transactions": "Transaksi",
        "reports": "Laporan",
        "ai_prediction": "Prediksi AI",
        "settings": "Pengaturan"
      },
      "header": {
        "welcome_back": "Welcome Back",
        "hello": "Halo",
        "online": "Online",
        "logout": "Keluar Akun",
        "dark_mode": "Mode Gelap",
        "light_mode": "Mode Terang",
        "language": "Bahasa"
      },
      // Dashboard
      "dashboard": {
        "business_overview": "Overview Bisnis",
        "welcome_message": "Selamat datang kembali, {{name}}. Berikut ringkasan performa bisnis Anda.",
        "income_this_month": "PEMASUKAN (BULAN INI)",
        "expense_this_month": "PENGELUARAN (BULAN INI)",
        "net_profit": "LABA BERSIH",
        "status_healthy": "Status: Sangat Sehat",
        "record_new_transaction": "CATAT TRANSAKSI BARU",
        "cash_flow_trend": "Tren Arus Kas",
        "income_vs_expense": "Pemasukan vs Pengeluaran bulan ini",
        "view_report": "LIHAT LAPORAN",
        "recent_transactions": "Transaksi Terakhir",
        "view_all": "Lihat Semua"
      }
    }
  },
  EN: {
    translation: {
      // Layout
      "menu": {
        "dashboard": "Dashboard",
        "transactions": "Transactions",
        "reports": "Reports",
        "ai_prediction": "AI Prediction",
        "settings": "Settings"
      },
      "header": {
        "welcome_back": "Welcome Back",
        "hello": "Hello",
        "online": "Online",
        "logout": "Logout",
        "dark_mode": "Dark Mode",
        "light_mode": "Light Mode",
        "language": "Language"
      },
      // Dashboard
      "dashboard": {
        "business_overview": "Business Overview",
        "welcome_message": "Welcome back, {{name}}. Here is your business performance summary.",
        "income_this_month": "INCOME (THIS MONTH)",
        "expense_this_month": "EXPENSE (THIS MONTH)",
        "net_profit": "NET PROFIT",
        "status_healthy": "Status: Very Healthy",
        "record_new_transaction": "RECORD NEW TRANSACTION",
        "cash_flow_trend": "Cash Flow Trend",
        "income_vs_expense": "Income vs Expense this month",
        "view_report": "VIEW REPORT",
        "recent_transactions": "Recent Transactions",
        "view_all": "View All"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ID',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
