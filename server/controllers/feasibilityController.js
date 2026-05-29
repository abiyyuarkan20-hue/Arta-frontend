const submitFeasibilityTest = async (req, res) => {
  try {
    const data = req.body;
    
    // 1. Validasi input
    if (!data.initial_capital || !data.business_sector) {
      return res.status(400).json({ status: "error", message: "Data tidak lengkap" });
    }

    // 2. Simulasi Model AI - Hitung Skor Kelayakan berdasarkan bobot cerdas
    let score = 50; // Base score
    
    // Modal Awal (Bobot 20%)
    if (data.initial_capital > 50000000) score += 20;
    else if (data.initial_capital > 10000000) score += 15;
    else score += 10;

    // ROI Target (Bobot 15%) - Lebih cepat lebih berisiko tapi bagus jika realistis
    if (data.roi_target_months <= 12) score += 10;
    else if (data.roi_target_months <= 24) score += 15;
    else score += 5;

    // Pengalaman (Bobot 20%)
    if (data.has_business_experience) score += 20;
    else score += 10;

    // Pendidikan & Keahlian (Bobot 10%)
    if (data.last_education === "Sarjana (S1+)") score += 10;
    else score += 5;

    // Lokasi & Marketing (Bobot 35%)
    if (data.strategic_location === "Pusat Perbelanjaan / Mall" || data.strategic_location === "Pinggir Jalan Raya Utama") score += 20;
    else score += 10;

    if (data.marketing_percentage > 20) score += 15;
    else score += 5;

    // Limit score to 99 max
    score = Math.min(99, score);
    
    let status = "Kurang Layak";
    let recommendation = "Pertimbangkan ulang rasio modal dan target ROI Anda. Coba kurangi biaya operasional awal.";
    
    if (score >= 80) {
      status = "Sangat Layak";
      recommendation = "Berdasarkan analisis, rencana bisnis ini memiliki probabilitas sukses yang SANGAT TINGGI. Strategi lokasi dan modal sudah ideal.";
    } else if (score >= 65) {
      status = "Layak";
      recommendation = "Rencana bisnis cukup solid. Pastikan Anda mengoptimalkan persentase marketing untuk mencapai target pasar Anda.";
    }

    // 3. Response mengikuti format persis API Vercel Arta
    return res.status(200).json({
      message: "Kuesioner kelayakan berhasil disimpan!",
      saved_data: {
        id: "mock-uuid-" + Date.now(),
        user_id: req.user.id,
        ...data
      },
      ai_input_used: {
        Initial_Capital: data.initial_capital,
        Marketing_Effort: data.marketing_percentage,
        ROI_Target: data.roi_target_months,
        Experience: data.has_business_experience ? 1 : 0
      },
      ai_prediction: {
        feasibility_score: score,
        status: status,
        recommendation: recommendation
      }
    });

  } catch (error) {
    console.error("❌ Feasibility Test Error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Gagal memproses data kelayakan bisnis",
    });
  }
};

module.exports = {
  submitFeasibilityTest,
};
