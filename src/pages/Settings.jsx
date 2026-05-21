import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  FiShield, FiPlus, FiEdit2, FiKey,
  FiBriefcase, FiMapPin, FiTag, FiSave, FiCheck, FiLoader,
  FiPhone, FiMail, FiGlobe, FiUsers, FiCalendar, FiFileText,
  FiInstagram, FiCreditCard, FiHash
} from "react-icons/fi";

// Data dummy untuk UI sementara
const DUMMY_USERS = [
  { id: 1, name: "Juanda (Anda)", email: "owner@artha.id", role: "Owner", status: "Active" },
  { id: 2, name: "Budi Santoso", email: "budi@artha.id", role: "Admin", status: "Active" },
  { id: 3, name: "Siti Aminah", email: "siti@artha.id", role: "User", status: "Active" },
];

const ROLE_PERMISSIONS = {
  Owner: {
    desc: "Memiliki akses penuh (Super Admin).",
    permissions: ["Kelola Pengaturan & Role", "Lihat, Tambah, Tarik Laporan", "Akses Semua Fitur"]
  },
  Admin: {
    desc: "Akses operasional menengah.",
    permissions: ["Tambah Data Transaksi", "Tarik & Download Laporan", "Tidak bisa ubah Role"]
  },
  User: {
    desc: "Akses operasional dasar.",
    permissions: ["Hanya Lihat Data", "Tarik Penjualan Saja", "Tidak bisa ubah/hapus data"]
  }
};

const businessCategories = [
  "Kuliner & Makanan",
  "Fashion & Pakaian",
  "Perdagangan Umum",
  "Jasa & Layanan",
  "Teknologi & Digital",
  "Pertanian & Perkebunan",
  "Kesehatan & Kecantikan",
  "Pendidikan",
  "Otomotif",
  "Lainnya",
];

const Settings = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get("tab") || "roles";
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: "", email: "", role: "User" });

  // State for Profil Usaha
  const [saveStatus, setSaveStatus] = useState("idle");
  const [businessProfile, setBusinessProfile] = useState({
    namaUsaha: "",
    kategoriUsaha: "",
    jenisUsaha: "",
    tahunBerdiri: "",
    jumlahKaryawan: "",
    teleponUsaha: "",
    emailUsaha: "",
    website: "",
    instagram: "",
    alamatUsaha: "",
    deskripsiUsaha: "",
    nib: "",
    npwp: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const m = user?.user_metadata || {};
        setBusinessProfile(prev => ({
          ...prev,
          namaUsaha: m.nama_usaha || "",
          kategoriUsaha: m.kategori_usaha || "",
          jenisUsaha: m.jenis_usaha || "",
          tahunBerdiri: m.tahun_berdiri || "",
          jumlahKaryawan: m.jumlah_karyawan || "",
          teleponUsaha: m.telepon_usaha || "",
          emailUsaha: m.email_usaha || "",
          website: m.website || "",
          instagram: m.instagram || "",
          alamatUsaha: m.alamat_usaha || "",
          deskripsiUsaha: m.deskripsi_usaha || "",
          nib: m.nib || "",
          npwp: m.npwp || "",
        }));
      } catch (e) {}
    }
  }, []);

  const handleBusinessChange = (field) => (e) =>
    setBusinessProfile((prev) => ({ ...prev, [field]: e.target.value }));

  const handleBusinessSave = () => {
    if (saveStatus === "saving") return;
    setSaveStatus("saving");
    setTimeout(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const updatedUser = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            nama_usaha: businessProfile.namaUsaha,
            kategori_usaha: businessProfile.kategoriUsaha,
            jenis_usaha: businessProfile.jenisUsaha,
            tahun_berdiri: businessProfile.tahunBerdiri,
            jumlah_karyawan: businessProfile.jumlahKaryawan,
            telepon_usaha: businessProfile.teleponUsaha,
            email_usaha: businessProfile.emailUsaha,
            website: businessProfile.website,
            instagram: businessProfile.instagram,
            alamat_usaha: businessProfile.alamatUsaha,
            deskripsi_usaha: businessProfile.deskripsiUsaha,
            nib: businessProfile.nib,
            npwp: businessProfile.npwp,
          },
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    }, 1200);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    alert("Ini hanyalah prototipe UI. Fitur pembuatan akun belum terhubung ke backend.");
    setIsAddModalOpen(false);
    setNewUserData({ name: "", email: "", role: "User" });
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-slate-500 font-medium mt-1">Kelola preferensi akun, hak akses, dan pengaturan aplikasi.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Konten Utama */}
        <div className="flex-1">
          {activeTab === "roles" && (
            <div className="space-y-6">
              
              {/* Banner Info Hak Akses (Khusus Owner) */}
              <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border border-white/20">
                    <FiKey size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black mb-1">Akses Spesial: Owner</h3>
                    <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl">
                      Anda saat ini login sebagai <strong>Owner</strong>. Hanya Owner yang dapat menambah, mengubah, dan menghapus akun Admin atau User lainnya untuk mengelola sistem kasir ini.
                    </p>
                  </div>
                </div>
              </div>

              {/* Box Hak Akses Penjelasan */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Hierarki Hak Akses (Roles)</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.keys(ROLE_PERMISSIONS).map(role => (
                    <div key={role} className="border border-slate-100 bg-slate-50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 text-xs font-black rounded-lg uppercase tracking-wider ${
                          role === 'Owner' ? 'bg-indigo-100 text-indigo-700' :
                          role === 'Admin' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {role}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-600 mb-4 h-10">{ROLE_PERMISSIONS[role].desc}</p>
                      <ul className="space-y-2">
                        {ROLE_PERMISSIONS[role].permissions.map((perm, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-500 font-medium">
                            <FiCheckCircle className="text-indigo-400 mt-0.5 shrink-0" />
                            {perm}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabel User */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800">Daftar Pengguna Aplikasi</h3>
                    <p className="text-xs text-slate-500 mt-1">Kelola akun yang bisa mengakses bisnis ini.</p>
                  </div>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[#111111] hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
                  >
                    <FiPlus size={18} /> TAMBAH AKSES BARU
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-bold">
                        <th className="px-6 py-4 border-b border-slate-100">Nama Pengguna</th>
                        <th className="px-6 py-4 border-b border-slate-100">Hak Akses (Role)</th>
                        <th className="px-6 py-4 border-b border-slate-100">Status</th>
                        <th className="px-6 py-4 border-b border-slate-100 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DUMMY_USERS.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs font-black rounded-lg uppercase tracking-wider inline-flex items-center justify-center ${
                                user.role === 'Owner' ? 'bg-indigo-100 text-indigo-700' :
                                user.role === 'Admin' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Aktif
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {user.role !== "Owner" && (
                              <button className="text-slate-400 hover:text-indigo-600 transition-colors p-2">
                                <FiEdit2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">

              {/* === IDENTITAS USAHA === */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <FiBriefcase size={15} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Identitas Usaha</h3>
                    <p className="text-xs text-slate-500">Informasi dasar tentang usaha Anda</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FiBriefcase size={11} /> Nama Usaha
                    </label>
                    <input type="text" value={businessProfile.namaUsaha} onChange={handleBusinessChange("namaUsaha")}
                      placeholder="Contoh: Warung Makan Sederhana"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FiTag size={11} /> Kategori Usaha
                      </label>
                      <select value={businessProfile.kategoriUsaha} onChange={handleBusinessChange("kategoriUsaha")}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm appearance-none cursor-pointer">
                        <option value="">Pilih Kategori...</option>
                        {businessCategories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FiFileText size={11} /> Jenis Usaha
                      </label>
                      <select value={businessProfile.jenisUsaha} onChange={handleBusinessChange("jenisUsaha")}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm appearance-none cursor-pointer">
                        <option value="">Pilih Jenis...</option>
                        <option value="Perorangan">Usaha Perorangan</option>
                        <option value="CV">CV (Commanditaire Vennootschap)</option>
                        <option value="PT">PT (Perseroan Terbatas)</option>
                        <option value="UD">UD (Usaha Dagang)</option>
                        <option value="Koperasi">Koperasi</option>
                        <option value="UMKM">UMKM</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FiCalendar size={11} /> Tahun Berdiri
                      </label>
                      <input type="number" min="1900" max="2099" value={businessProfile.tahunBerdiri} onChange={handleBusinessChange("tahunBerdiri")}
                        placeholder="Contoh: 2020"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FiUsers size={11} /> Jumlah Karyawan
                      </label>
                      <select value={businessProfile.jumlahKaryawan} onChange={handleBusinessChange("jumlahKaryawan")}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm appearance-none cursor-pointer">
                        <option value="">Pilih Rentang...</option>
                        <option value="1-5">1 - 5 orang</option>
                        <option value="6-10">6 - 10 orang</option>
                        <option value="11-25">11 - 25 orang</option>
                        <option value="26-50">26 - 50 orang</option>
                        <option value="51-100">51 - 100 orang</option>
                        <option value=">100">Lebih dari 100 orang</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FiFileText size={11} /> Deskripsi Usaha
                    </label>
                    <textarea value={businessProfile.deskripsiUsaha} onChange={handleBusinessChange("deskripsiUsaha")}
                      placeholder="Ceritakan tentang produk/jasa yang ditawarkan dan keunggulan usaha Anda..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm resize-none" />
                  </div>
                </div>
              </div>

              {/* === KONTAK & LOKASI === */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <FiMapPin size={15} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Kontak dan Lokasi</h3>
                    <p className="text-xs text-slate-500">Informasi kontak dan alamat usaha</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FiPhone size={11} /> Telepon Usaha
                      </label>
                      <input type="tel" value={businessProfile.teleponUsaha} onChange={handleBusinessChange("teleponUsaha")}
                        placeholder="021-12345678"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FiMail size={11} /> Email Usaha
                      </label>
                      <input type="email" value={businessProfile.emailUsaha} onChange={handleBusinessChange("emailUsaha")}
                        placeholder="info@usahasaya.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FiMapPin size={11} /> Alamat Usaha
                    </label>
                    <textarea value={businessProfile.alamatUsaha} onChange={handleBusinessChange("alamatUsaha")}
                      placeholder="Masukkan alamat lengkap usaha Anda..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm resize-none" />
                  </div>
                </div>
              </div>

              {/* === DIGITAL & MEDIA SOSIAL === */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <FiGlobe size={15} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Digital dan Media Sosial</h3>
                    <p className="text-xs text-slate-500">Website dan akun media sosial usaha (opsional)</p>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FiGlobe size={11} /> Website
                    </label>
                    <input type="url" value={businessProfile.website} onChange={handleBusinessChange("website")}
                      placeholder="https://www.usahasaya.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FiInstagram size={11} /> Instagram
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">@</span>
                      <input type="text" value={businessProfile.instagram} onChange={handleBusinessChange("instagram")}
                        placeholder="nama_akun"
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* === LEGALITAS === */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <FiShield size={15} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Legalitas Usaha</h3>
                    <p className="text-xs text-slate-500">Nomor izin dan dokumen legal usaha (opsional)</p>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FiHash size={11} /> NIB (Nomor Induk Berusaha)
                    </label>
                    <input type="text" value={businessProfile.nib} onChange={handleBusinessChange("nib")}
                      placeholder="Contoh: 1234567890123"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FiCreditCard size={11} /> NPWP Usaha
                    </label>
                    <input type="text" value={businessProfile.npwp} onChange={handleBusinessChange("npwp")}
                      placeholder="Contoh: 00.000.000.0-000.000"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-200 shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <p className="text-xs text-slate-400 font-medium">Perubahan akan disimpan ke akun Anda</p>
                <button
                  onClick={handleBusinessSave}
                  disabled={saveStatus === "saving" || saveStatus === "saved"}
                  className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-black text-sm transition-all duration-300 shadow-md active:scale-95
                    ${saveStatus === "saved"
                      ? "bg-emerald-500 text-white shadow-emerald-500/30"
                      : "bg-slate-900 text-white hover:bg-slate-700 shadow-slate-900/20"
                    }
                    disabled:opacity-80 disabled:cursor-not-allowed`}
                >
                  {saveStatus === "saving" && <FiLoader size={16} className="animate-spin" />}
                  {saveStatus === "saved" && <FiCheck size={16} strokeWidth={3} />}
                  {saveStatus === "idle" && <FiSave size={16} strokeWidth={2.5} />}
                  {saveStatus === "saving" && "Menyimpan..."}
                  {saveStatus === "saved" && "Tersimpan!"}
                  {saveStatus === "idle" && "Simpan Perubahan"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Akses (UI Prototype) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-fade-in-up">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Buat Akun Akses Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500 p-1">✕</button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  placeholder="Ketik nama karyawan..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Karyawan</label>
                <input 
                  type="email" 
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  placeholder="email@perusahaan.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Role</label>
                <select 
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium bg-white"
                >
                  <option value="Admin">Admin (Akses Menengah)</option>
                  <option value="User">User (Hanya Lihat Data)</option>
                </select>
                <p className="text-[11px] text-slate-400 font-medium mt-2">
                  *Sebagai Owner, hanya Anda yang dapat mengontrol akses ini.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// FiCheckCircle component
function FiCheckCircle(props) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}

export default Settings;
