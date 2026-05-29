const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ ERROR: SUPABASE_URL atau SUPABASE_KEY tidak ditemukan di file .env",
  );
}

// Inisialisasi client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

const createAuthClient = (token) => {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
};

module.exports = supabase;
module.exports.createAuthClient = createAuthClient;
