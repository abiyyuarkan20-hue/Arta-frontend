import api from "./api";

const businessService = {
  // Simpan/Daftarkan profil bisnis baru ke backend Arta
  onboardingBusiness: async (data) => {
    return api.post("/api/profile/onboarding", data);
  },

  // Minta prediksi rekomendasi (jika endpoint ini berada di backend Vercel Arta juga)
  predictFeasibility: async (wizardData) => {
    // Sesuaikan endpoint dengan dokumentasi Vercel jika AI prediction ada di sana.
    // Jika AI model dipisah di service Python/FastAPI, maka baseURL di sini bisa disesuaikan atau dilempar via proxy Vercel.
    return api.post("/api/predict-business", wizardData);
  }
};

export default businessService;
