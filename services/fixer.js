// services/fx.js
const axios = require("axios");
const FIXER_KEY = process.env.FIXER_API_KEY;

let cache = { rates: {}, timestamp: 0 };

async function getRates() {
  const now = Date.now();
  if (now - cache.timestamp < 1000 * 60 * 60) {
    return cache.rates; // return cached rates (1hr TTL)
  }

  try {
    const { data } = await axios.get(`https://api.apilayer.com/fixer/latest?base=NGN`, {
      headers: { apikey: FIXER_KEY },
    });

    if (data.success) {
      cache = { rates: data.rates, timestamp: now };
      return data.rates;
    }
  } catch (err) {
    console.error("⚠️ FX fetch error:", err.message);
  }

  return {}; // fallback
}

module.exports = { getRates };
