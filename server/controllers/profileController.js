const supabase = require("../services/supabase");
const supabaseAdmin = supabase.supabaseAdmin;

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const authSupabase = supabase.createAuthClient(req.token);

    let { data, error } = await authSupabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    res.status(200).json({ status: "success", data: { profile: data } });
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

    const authSupabase = supabase.createAuthClient(req.token);
    const isAdmin = !!supabaseAdmin;
    const dbClient = supabaseAdmin || authSupabase;

    const updateData = {
      id: userId,
      user_type,
      onboarding_completed: true,
      nama_usaha: nama_usaha || null,
      tipe_usaha: tipe_usaha || null,
      business_id: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
    };

    let profile;
    if (isAdmin) {
      const { data, error } = await dbClient
        .from("profiles")
        .upsert(updateData)
        .select()
        .single();
      if (error) throw error;
      profile = data;
    } else {
      const { error } = await dbClient
        .from("profiles")
        .upsert(updateData);
      if (error) throw error;
      const { data } = await authSupabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      profile = data;
    }

    res.status(200).json({
      status: "success",
      message: "Profil berhasil diperbarui.",
      data: { profile },
    });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

// --- UPGRADE TIPE AKUN ---
const upgradeToUmkm = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nama_usaha, tipe_usaha } = req.body;

    const authSupabase = supabase.createAuthClient(req.token);
    const isAdmin = !!supabaseAdmin;
    const dbClient = supabaseAdmin || authSupabase;

    const upsertData = {
      id: userId,
      user_type: "umkm_aktif",
      nama_usaha,
      tipe_usaha,
      business_id: crypto.randomUUID(),
      updated_at: new Date().toISOString(),
    };

    let profile;
    if (isAdmin) {
      const { data, error } = await dbClient
        .from("profiles")
        .upsert(upsertData)
        .select()
        .single();
      if (error) throw error;
      profile = data;
    } else {
      const { error } = await dbClient
        .from("profiles")
        .upsert(upsertData);
      if (error) throw error;
      const { data } = await authSupabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      profile = data;
    }

    res.status(200).json({ status: "success", data: { profile } });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

// --- UPDATE PROFILE (Update Data Diri) ---
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nama_lengkap, telepon, bio } = req.body;

    const authSupabase = supabase.createAuthClient(req.token);
    const dbClient = supabaseAdmin || authSupabase;

    const updateData = {
      updated_at: new Date().toISOString(),
    };
    
    if (nama_lengkap !== undefined) {
      updateData.nama_lengkap = nama_lengkap;
      updateData.name = nama_lengkap; // Update dua-duanya untuk kompatibilitas
    }
    if (telepon !== undefined) updateData.telepon = telepon;
    if (bio !== undefined) updateData.bio = bio;

    const { data, error } = await dbClient
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: "success",
      message: "Profil berhasil diperbarui.",
      data: { profile: data },
    });
  } catch (error) {
    console.error("❌ Update Profile Error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

// --- SYNC BUSINESS ID (untuk karyawan yang belum memiliki business_id) ---
const syncBusinessId = async (req, res) => {
  try {
    const userId = req.user.id;
    const dbClient = supabaseAdmin || supabase.createAuthClient(req.token);

    // Cari Owner untuk mendapatkan business_id
    const { data: ownerProfile } = await dbClient
      .from("profiles")
      .select("business_id")
      .eq("role", "OWNER")
      .maybeSingle();

    if (!ownerProfile?.business_id) {
      const newBusinessId = crypto.randomUUID();
      await dbClient
        .from("profiles")
        .update({ business_id: newBusinessId, updated_at: new Date().toISOString() })
        .eq("role", "OWNER");
      ownerProfile.business_id = newBusinessId;
    }

    // Update business_id user saat ini
    const { data, error } = await dbClient
      .from("profiles")
      .update({ business_id: ownerProfile.business_id, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: "success",
      message: "Business ID berhasil disinkronkan!",
      data: { profile: data },
    });
  } catch (error) {
    console.error("❌ Sync Business ID Error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

module.exports = { getProfile, updateOnboarding, upgradeToUmkm, updateProfile, syncBusinessId };