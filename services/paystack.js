// services/paystack.js
const axios = require("axios");
const crypto = require("crypto");
const Vendor = require("../models/Vendor");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const BASE_URL = process.env.BASE_URL || "https://paymint.ng";

// Paystack API setup
const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json",
  },
});

// ✅ Generate a payment link
async function generateSubscriptionLink({ email, phone }) {
  try {
    const res = await paystack.post("/transaction/initialize", {
      email,
      amount: 1000 * 100, // ₦1000 in kobo
      currency: "NGN",
      channels: [
        "card",
        "bank",
        "ussd",
        "qr",
        "mobile_money",
        "bank_transfer",
      ],
      metadata: {
        vendor: phone,
        plan: "premium",
        cancel_action: `${BASE_URL}/subscribe/cancel`,
      },
      callback_url: `${BASE_URL}/subscribe/success`,
      bearer: "account",
      custom_fields: [
        {
          display_name: "Vendor Phone",
          variable_name: "vendor_phone",
          value: phone,
        },
      ],
    });

    return res.data.data.authorization_url;
  } catch (err) {
    console.error("❌ Paystack init error:", err.response?.data || err.message);
    return null;
  }
}

// ✅ Create a dedicated bank transfer payment
async function createBankTransferPayment({ email, phone }) {
  try {
    const initRes = await paystack.post("/transaction/initialize", {
      email,
      amount: 1000 * 100,
      currency: "NGN",
      channels: ["bank_transfer"],
      metadata: {
        vendor: phone,
        plan: "premium",
        payment_method: "bank_transfer",
      },
    });

    const { reference } = initRes.data.data;

    const accountRes = await paystack.post("/dedicated_account", {
      email,
      first_name: "Paymint",
      last_name: "Customer",
      phone,
      preferred_bank: "wema-bank", // optional: 'titan-bank'
      country: "NG",
      amount: 1000 * 100,
      currency: "NGN",
      metadata: {
        vendor: phone,
        reference,
      },
    });

    return {
      reference,
      account_number: accountRes.data.data.account_number,
      account_name: accountRes.data.data.account_name,
      bank_name: accountRes.data.data.bank.name,
      bank_code: accountRes.data.data.bank.code,
      amount: 1000,
      expires_at: accountRes.data.data.expires_at,
    };
  } catch (err) {
    console.error("❌ Bank transfer creation error:", err.response?.data || err.message);
    return null;
  }
}

// ✅ Verify incoming webhook from Paystack
function validateWebhook(req) {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  return hash === req.headers["x-paystack-signature"];
}

// ✅ Handle incoming Paystack webhook events
async function handleWebhook(eventData) {
  try {
    console.log(`🔔 Webhook event: ${eventData.event}`);

    switch (eventData.event) {
      case "charge.success":
        await handleSuccessfulCharge(eventData.data);
        break;

      case "charge.failed":
        await handleFailedCharge(eventData.data);
        break;

      case "transfer.success":
        await handleSuccessfulTransfer(eventData.data);
        break;

      case "transfer.failed":
        await handleFailedTransfer(eventData.data);
        break;

      case "dedicated_account.assign.success":
        await handleDedicatedAccountAssigned(eventData.data);
        break;

      case "dedicated_account.assign.failed":
        await handleDedicatedAccountFailed(eventData.data);
        break;

      default:
        console.log(`ℹ️ Unhandled webhook event: ${eventData.event}`);
    }
  } catch (error) {
    console.error("❌ Webhook handling error:", error);
    throw error;
  }
}

// ✅ On successful charge (card or transfer)
async function handleSuccessfulCharge(data) {
  const { metadata, customer, amount, reference, channel } = data;

  if (!metadata || !metadata.vendor) {
    console.log("❌ No vendor metadata in successful charge");
    return;
  }

  const vendorPhone = metadata.vendor;

  await Vendor.findOneAndUpdate(
    { phone: vendorPhone },
    {
      plan: "premium",
      subscriptionDate: new Date(),
      subscriptionAmount: amount / 100,
      paymentStatus: "paid",
      paymentReference: reference,
      paymentMethod: channel,
      lastPaymentDate: new Date(),
    },
    { new: true }
  );

  console.log(`✅ Vendor ${vendorPhone} upgraded to premium via ${channel}`);
}

// Optional: handle failed charge
async function handleFailedCharge(data) {
  console.log("❌ Payment failed:", data.reference);
}

// Optional: outgoing transfer success (usually not used here)
async function handleSuccessfulTransfer(data) {
  console.log("💸 Transfer successful:", data.reference);
}

// Optional: outgoing transfer failure
async function handleFailedTransfer(data) {
  console.log("❌ Transfer failed:", data.reference);
}

// ✅ Handle dedicated account assigned
async function handleDedicatedAccountAssigned(data) {
  const { metadata } = data;

  if (metadata && metadata.vendor) {
    await Vendor.findOneAndUpdate(
      { phone: metadata.vendor },
      {
        dedicatedAccount: {
          account_number: data.account_number,
          account_name: data.account_name,
          bank_name: data.bank.name,
          assigned_at: new Date(),
        },
      }
    );
    console.log(`🏦 Dedicated account assigned to vendor: ${metadata.vendor}`);
  }
}

// ✅ Handle dedicated account assignment failure
async function handleDedicatedAccountFailed(data) {
  console.log("❌ Dedicated account assignment failed:", data);
}

// ✅ Verify transaction manually
async function getTransactionDetails(reference) {
  try {
    const res = await paystack.get(`/transaction/verify/${reference}`);
    return res.data.data;
  } catch (err) {
    console.error("❌ Transaction verification error:", err.response?.data || err.message);
    return null;
  }
}

module.exports = {
  generateSubscriptionLink,
  createBankTransferPayment,
  validateWebhook,
  handleWebhook,
  verifyTransaction: getTransactionDetails,
};
