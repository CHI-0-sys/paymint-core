// // services/paystack.js
// const axios = require("axios");
// const { paystackSecret } = require("../config/env");

// const baseURL = "https://api.paystack.co";

// const paystack = axios.create({
//   baseURL,
//   headers: {
//     Authorization: `Bearer ${paystackSecret}`,
//     "Content-Type": "application/json",
//   },
// });

// /**
//  * Verify a transaction by reference
//  */
// async function verifyTransaction(reference) {
//   try {
//     const res = await paystack.get(`/transaction/verify/${reference}`);
//     return res.data.status ? res.data.data : null;
//   } catch (err) {
//     console.error("Paystack verification failed:", err.message);
//     return null;
//   }
// }

// /**
//  * Create a one-time or recurring subscription (later if needed)
//  */
// // async function createSubscription(...) {...}

// /**
//  * Handle webhook (we’ll build this into an endpoint later)
//  */
// function validateWebhook(headers, body) {
//   const crypto = require("crypto");
//   const secret = process.env.PAYSTACK_WEBHOOK_SECRET;

//   const hash = crypto
//     .createHmac("sha512", secret)
//     .update(JSON.stringify(body))
//     .digest("hex");

//   return headers["x-paystack-signature"] === hash;
// }

// module.exports = {
//   verifyTransaction,
//   validateWebhook,
//   // createSubscription (later)
// };
