// services/paystack.js
const axios = require("axios");
const { getDB } = require("./db");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json",
  },
});

// ✅ Verify transaction reference
async function verifyPayment(reference) {
  try {
    const res = await paystack.get(`/transaction/verify/${reference}`);
    return res.data.status && res.data.data;
  } catch (err) {
    console.error("❌ Paystack verify error:", err.message);
    return null;
  }
}

// ✅ Handle webhook (to be used in a simple express route if needed)
async function handleWebhook(data) {
  if (data.event === "charge.success") {
    const customerPhone = data.data.customer.phone || data.data.metadata.phone;
    const db = getDB();

    await db.collection("vendors").updateOne(
      { phone: customerPhone },
      {
        $set: {
          plan: "premium",
          subscribedAt: new Date(),
        },
      }
    );

    console.log(`✅ Subscription updated for ${customerPhone}`);
  }
}

module.exports = {
  verifyPayment,
  handleWebhook,
};
