require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. MIDDLEWARE GLOBAL (Pengaturan Order yang Benar)
// ==========================================
// Pastikan CORS adalah middleware pertama agar 'pre-flight' request ditangani dengan benar
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "https://arta-frontend.vercel.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: '10mb' })); // Menambah limit payload jika ada kiriman gambar
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ==========================================
// 2. DAFTAR ROUTES
// ==========================================

// Auth routes (Publik)
app.use("/api/auth", authRoutes);

// Profile routes (Dilindungi)
app.use("/api/profile", authMiddleware, profileRoutes);

// User management routes (Dilindungi — hanya Owner/Admin)
app.use("/api/users", authMiddleware, userRoutes);

// Test Route
app.get("/", (req, res) => {
  res.json({ status: "success", message: "Server Arta API aktif!" });
});

// Health Check
app.get("/api/health", async (req, res) => {
  res.json({ status: "success", message: "Koneksi stabil." });
});

// ==========================================
// 3. ERROR HANDLING (Robust)
// ==========================================

// Menangani 404
app.use((req, res, next) => {
  res.status(404).json({ status: "error", message: "Endpoint tidak ditemukan." });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Terjadi Kesalahan:", err.message);

  // Mengirim error yang lebih informatif
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});