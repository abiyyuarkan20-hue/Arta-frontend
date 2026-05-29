import api from "./api";

const transactionService = {
  // Ambil semua transaksi
  getTransactions: async (params = {}) => {
    return api.get("/api/transactions", { params });
  },

  // Ambil transaksi berdasarkan ID
  getTransactionById: async (id) => {
    return api.get(`/api/transactions/${id}`);
  },

  // Buat transaksi baru (pemasukan/pengeluaran)
  createTransaction: async (data) => {
    return api.post("/api/transactions", data);
  },

  // Update transaksi
  updateTransaction: async (id, data) => {
    return api.put(`/api/transactions/${id}`, data);
  },

  // Hapus transaksi
  deleteTransaction: async (id) => {
    return api.delete(`/api/transactions/${id}`);
  },
  
  // Ambil laporan (reports)
  getReports: async (params = {}) => {
    return api.get("/api/transactions/reports", { params });
  }
};

export default transactionService;
