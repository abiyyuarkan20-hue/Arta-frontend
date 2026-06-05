const supabase = require("../services/supabase");
const supabaseAdmin = supabase.supabaseAdmin;

// --- GET ALL USERS (untuk Owner melihat daftar tim) ---
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    if (!supabaseAdmin) {
      return res.status(500).json({
        status: "error",
        message: "Admin client tidak tersedia. Pastikan SUPABASE_SERVICE_ROLE_KEY sudah diset.",
      });
    }

    // Ambil profil Owner untuk mendapatkan business_id
    const { data: ownerProfile } = await supabaseAdmin
      .from("profiles")
      .select("business_id")
      .eq("id", currentUserId)
      .maybeSingle();

    const ownerBusinessId = ownerProfile?.business_id;

    // Ambil profil dari tabel profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*");

    if (profileError) {
      console.error("Error fetching profiles:", profileError.message);
    }

    // Auto-sync business_id ke karyawan yang belum memilikinya
    if (ownerBusinessId && profiles) {
      const employeesToFix = profiles.filter(
        (p) =>
          p.id !== currentUserId &&
          ["ADMIN", "USER", "STAFF"].includes(p.role?.toUpperCase()) &&
          !p.business_id
      );
      for (const emp of employeesToFix) {
        await supabaseAdmin
          .from("profiles")
          .update({ business_id: ownerBusinessId, updated_at: new Date().toISOString() })
          .eq("id", emp.id);
      }
      if (employeesToFix.length > 0) {
        console.log(`Auto-sync business_id ke ${employeesToFix.length} karyawan`);
        // Re-fetch profiles setelah sync agar data lokal up-to-date
        const { data: updatedProfiles } = await supabaseAdmin
          .from("profiles")
          .select("*");
        if (updatedProfiles) profiles = updatedProfiles;
      }
    }

    // Ambil semua user dari Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) throw authError;

    // Filter profil hanya milik bisnis yang sama
    const businessProfiles = (profiles || [])
      .filter((p) => p.business_id && p.business_id === ownerBusinessId)
      .reduce((map, p) => {
        map[p.id] = p;
        return map;
      }, {});

    // Selalu sertakan current user (Owner) meskipun business_id-nya beda
    businessProfiles[currentUserId] = businessProfiles[currentUserId] || (profiles || []).find(p => p.id === currentUserId);

    const users = (authData?.users || [])
      .filter((authUser) => businessProfiles[authUser.id])
      .map((authUser) => {
        const profile = businessProfiles[authUser.id];

        const name =
          profile?.name ||
          profile?.nama_lengkap ||
          authUser.user_metadata?.nama_lengkap ||
          authUser.user_metadata?.name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "Unknown";

        const role =
          profile?.role ||
          authUser.user_metadata?.role ||
          "USER";

        return {
          id: authUser.id,
          email: authUser.email,
          name: name,
          role: role.toUpperCase(),
          created_at: authUser.created_at,
          is_current_user: authUser.id === currentUserId,
        };
      });

    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    console.error("❌ Get All Users Error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

// --- CREATE USER (Owner membuat akun karyawan baru) ---
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email dan password wajib diisi.",
      });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({
        status: "error",
        message: "Admin client tidak tersedia.",
      });
    }

    // Tentukan role yang diizinkan (tidak boleh membuat Owner)
    const allowedRoles = ["ADMIN", "USER"];
    const finalRole = allowedRoles.includes((role || "").toUpperCase())
      ? (role || "").toUpperCase()
      : "USER";

    // Ambil business_id dari Owner yang sedang login
    let ownerBusinessId = null;
    try {
      const { data: ownerProfile } = await supabaseAdmin
        .from("profiles")
        .select("business_id")
        .eq("id", req.user.id)
        .maybeSingle();
      ownerBusinessId = ownerProfile?.business_id || null;
    } catch (err) {
      console.warn("Gagal mengambil business_id Owner:", err.message);
    }

    // 1. Buat user di Supabase Auth menggunakan Admin API (skip email confirmation)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email agar langsung bisa login
        user_metadata: {
          name: name,
          nama_lengkap: name,
          role: finalRole,
        },
      });

    if (authError) throw authError;

    const newUserId = authData.user.id;

    // 2. Update profil di tabel profiles (trigger mungkin sudah buat row-nya)
    //    Gunakan upsert agar aman dari duplikat
    const profileData = {
      id: newUserId,
      email: email,
      name: name,
      role: finalRole,
      user_type: "umkm_aktif",
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };
    if (ownerBusinessId) {
      profileData.business_id = ownerBusinessId;
    }
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profileData);

    if (profileError) {
      console.error("Profile upsert warning:", profileError.message);
      // Jangan throw — user sudah berhasil dibuat di auth
    }

    res.status(201).json({
      status: "success",
      message: "Akun berhasil dibuat! Karyawan dapat langsung login.",
      data: {
        id: newUserId,
        email: email,
        name: name,
        role: finalRole,
      },
    });
  } catch (error) {
    console.error("❌ Create User Error:", error.message);

    let message = error.message;
    if (message.includes("already been registered") || message.includes("already exists")) {
      message = "Email ini sudah terdaftar. Gunakan email lain.";
    }

    res.status(400).json({ status: "error", message });
  }
};

// --- UPDATE USER (Owner mengubah nama/role karyawan) ---
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;
    const currentUserId = req.user.id;

    if (!supabaseAdmin) {
      return res.status(500).json({
        status: "error",
        message: "Admin client tidak tersedia.",
      });
    }

    // Cek apakah user yang diedit ada
    const { data: targetUser, error: fetchError } =
      await supabaseAdmin.auth.admin.getUserById(id);

    if (fetchError || !targetUser?.user) {
      return res.status(404).json({
        status: "error",
        message: "User tidak ditemukan.",
      });
    }

    // Cek profil target untuk mengetahui role saat ini
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", id)
      .maybeSingle();

    const currentRole = (targetProfile?.role || targetUser.user.user_metadata?.role || "").toUpperCase();

    // Jika target adalah OWNER, hanya boleh ubah nama, TIDAK boleh ubah role
    const updatePayload = {};
    if (name !== undefined) {
      updatePayload.name = name;
      updatePayload.nama_lengkap = name;
    }
    if (role !== undefined && currentRole !== "OWNER") {
      const allowedRoles = ["ADMIN", "USER"];
      updatePayload.role = allowedRoles.includes(role.toUpperCase())
        ? role.toUpperCase()
        : currentRole;
    } else if (currentRole === "OWNER") {
      updatePayload.role = "OWNER"; // Pertahankan role OWNER
    }

    // 1. Update user_metadata di Supabase Auth
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: {
        ...targetUser.user.user_metadata,
        ...updatePayload,
      },
    });

    if (authUpdateError) throw authUpdateError;

    // 2. Update profil di tabel profiles
    const profileUpdate = { updated_at: new Date().toISOString() };
    if (updatePayload.name !== undefined) profileUpdate.name = updatePayload.name;
    if (updatePayload.role !== undefined) profileUpdate.role = updatePayload.role;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", id);

    if (profileError) {
      console.error("Profile update warning:", profileError.message);
    }

    res.status(200).json({
      status: "success",
      message: "Akun berhasil diperbarui.",
      data: {
        id,
        name: updatePayload.name || name,
        role: updatePayload.role || currentRole,
      },
    });
  } catch (error) {
    console.error("❌ Update User Error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

// --- DELETE USER (Owner menghapus akun karyawan) ---
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    if (!supabaseAdmin) {
      return res.status(500).json({
        status: "error",
        message: "Admin client tidak tersedia.",
      });
    }

    // Tidak boleh hapus diri sendiri
    if (id === currentUserId) {
      return res.status(403).json({
        status: "error",
        message: "Anda tidak bisa menghapus akun Anda sendiri.",
      });
    }

    // Cek apakah target adalah OWNER — tidak boleh dihapus
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", id)
      .maybeSingle();

    if (targetProfile?.role?.toUpperCase() === "OWNER") {
      return res.status(403).json({
        status: "error",
        message: "Akun Owner tidak bisa dihapus.",
      });
    }

    // 1. Hapus profil dari tabel profiles
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileDeleteError) {
      console.error("Profile delete warning:", profileDeleteError.message);
    }

    // 2. Hapus user dari Supabase Auth
    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (authDeleteError) throw authDeleteError;

    res.status(200).json({
      status: "success",
      message: "Akun berhasil dihapus.",
    });
  } catch (error) {
    console.error("❌ Delete User Error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

// --- SET OWNER ROLE (untuk user pertama / akun utama) ---
const setOwnerRole = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentEmail = req.user.email;

    if (!supabaseAdmin) {
      return res.status(500).json({
        status: "error",
        message: "Admin client tidak tersedia.",
      });
    }

    // Cek apakah sudah ada OWNER di sistem
    const { data: existingOwner } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("role", "OWNER")
      .maybeSingle();

    if (existingOwner && existingOwner.id !== currentUserId) {
      return res.status(403).json({
        status: "error",
        message: "Sudah ada Owner lain di sistem ini.",
      });
    }

    // Set role OWNER di profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: currentUserId,
        email: currentEmail,
        role: "OWNER",
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Set Owner profile error:", profileError.message);
    }

    // Update user_metadata
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(currentUserId, {
      user_metadata: {
        ...req.user.user_metadata,
        role: "OWNER",
      },
    });

    if (authError) {
      console.error("Set Owner auth error:", authError.message);
    }

    res.status(200).json({
      status: "success",
      message: "Role OWNER berhasil ditetapkan.",
    });
  } catch (error) {
    console.error("❌ Set Owner Error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  setOwnerRole,
};
