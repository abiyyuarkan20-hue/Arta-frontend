require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const authMiddleware = require("./middleware/authMiddleware");

// Inisialisasi Express
const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. MIDDLEWARE GLOBAL
// ==========================================
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], // Support both standard Vite ports
    credentials: true,
  }),
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// ==========================================
// 2. DAFTAR ROUTES
// ==========================================

// Auth routes (tidak dilindungi JWT — register, login, verify-otp, dsb)
app.use("/api/auth", authRoutes);

// Profile routes (dilindungi JWT)
app.use("/api/profile", authMiddleware, profileRoutes);

// Contoh: Rute yang dilindungi JWT middleware
// app.use("/api/transactions", authMiddleware, transactionRoutes);
// app.use("/api/reports", authMiddleware, reportRoutes);

// Test Route Dasar
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Server UMKM Finance API berjalan dengan baik! 🚀",
  });
});

// Route untuk mengecek koneksi Supabase
app.get("/api/health", async (req, res, next) => {
  try {
    const supabase = require("./services/supabase");

    const { data, error } = await supabase
      .from("_test_connection_")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116" && error.code !== "42P01" && !error.message.includes("Could not find the table")) {
      throw error;
    }

    res.json({
      status: "success",
      message: "Koneksi Supabase berhasil & API siap digunakan! 🚀",
    });
  } catch (error) {
    next(error);
  }
});

// Route terproteksi contoh — untuk test middleware JWT
app.get("/api/me", authMiddleware, (req, res) => {
  res.json({
    status: "success",
    message: "Data user terautentikasi",
    data: { user: req.user },
  });
});

// ==========================================
// 3. ERROR HANDLING (Mencegah Server Crash)
// ==========================================

// Middleware untuk menangani Route yang tidak ditemukan (404)
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message:
      "Endpoint API tidak ditemukan (404). Silakan cek kembali URL Anda.",
  });
});

// Global Error Handler (Menangkap semua error dari blok try-catch)
app.use((err, req, res, next) => {
  console.error("❌ Terjadi Kesalahan Internal:", err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    message:
      err.message || "Terjadi kesalahan pada server (Internal Server Error).",
  });
});

// ==========================================
// 4. JALANKAN SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`=========================================`);
});
