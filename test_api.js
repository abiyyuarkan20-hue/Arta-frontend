const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://arta-backend-nine.vercel.app/api/users', {
      name: "Test Employee",
      email: "test.employee123@example.com",
      role: "USER"
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.log("ERROR:", err.response?.status, err.response?.data || err.message);
  }
}

test();
