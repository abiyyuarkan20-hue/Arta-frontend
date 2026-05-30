const supabase = require("../services/supabase");

// --- AMBIL PROFIL USER ---
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const authSupabase = supabase.createAuthClient(req.token);

    const { data, error } = await authSupabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    // Jika profil belum ada, buat profil baru
    if (!data) {
      const { data: newProfile, error: insertError } = await authSupabase
        .from("profiles")
        .insert({
          id: userId,
          nama_lengkap: req.user.user_metadata?.nama_lengkap || req.user.user_metadata?.full_name || "",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return res.status(200).json({
        status: "success",
        data: { profile: newProfile },
      });
    }

    res.status(200).json({
      status: "success",
      data: { profile: data },
    });
  } catch (error) {
    console.error("❌ Get Profile Error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

// --- SIMPAN HASIL ONBOARDING ---
const updateOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_type, nama_usaha, tipe_usaha } = req.body;

    if (!user_type || !["calon_pengusaha", "umkm_aktif"].includes(user_type)) {
      return res.status(400).json({
        status: "error",
        message: "Tipe akun tidak valid. Pilih 'calon_pengusaha' atau 'umkm_aktif'.",
      });
    }

    const updateData = {
      user_type,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    // Jika umkm_aktif, simpan juga data bisnis
    if (user_type === "umkm_aktif") {
      if (nama_usaha) updateData.nama_usaha = nama_usaha;
      if (tipe_usaha) updateData.tipe_usaha = tipe_usaha;
    }

    const authSupabase = supabase.createAuthClient(req.token);

    const { data, error } = await authSupabase
      .from("profiles")
      .upsert({ id: userId, ...updateData })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: "success",
      message: user_type === "umkm_aktif"
        ? "Profil bisnis berhasil disimpan! Selamat datang di Dashboard UMKM."
        : "Onboarding selesai! Selamat datang di Dashboard Calon Pengusaha.",
      data: { profile: data },
    });
  } catch (error) {
    console.error("❌ Update Onboarding Error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

// --- UPGRADE TIPE AKUN ---
const upgradeToUmkm = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nama_usaha, tipe_usaha } = req.body;

    if (!nama_usaha || !tipe_usaha) {
      return res.status(400).json({
        status: "error",
        message: "Nama usaha dan tipe usaha wajib diisi.",
      });
    }

    const authSupabase = supabase.createAuthClient(req.token);

    const { data, error } = await authSupabase
      .from("profiles")
      .upsert({
        id: userId,
        user_type: "umkm_aktif",
        nama_usaha,
        tipe_usaha,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: "success",
      message: "Selamat! Akun Anda berhasil di-upgrade ke UMKM Aktif.",
      data: { profile: data },
    });
  } catch (error) {
    console.error("❌ Upgrade Error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getProfile,
  updateOnboarding,
  upgradeToUmkm,
};
