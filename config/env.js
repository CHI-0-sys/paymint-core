// config/env.js
const dotenv = require("dotenv");

dotenv.config();

const required = [
  "MONGO_URI",
  "PAYSTACK_SECRET",
  "PAYSTACK_PUBLIC",
  "WHATSAPP_NUMBER", // optional if needed for logs or default replies
];

required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  mongoUri: process.env.MONGO_URI,
  paystackSecret: process.env.PAYSTACK_SECRET,
  paystackPublic: process.env.PAYSTACK_PUBLIC,

  whatsappNumber: process.env.WHATSAPP_NUMBER || "",
  // FIXER_KEY = process.env.FIXER_API_KEY || "", // optional for FX rates
};
