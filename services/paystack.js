const axios = require("axios");
const crypto = require('crypto');
const Vendor = require("../models/Vendor");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
const BASE_URL = process.env.BASE_URL || "https://paymint.ng";

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    "Content-Type": "application/json",
  },
});

// ✅ Generate payment link with bank transfer enabled
async function generateSubscriptionLink({ email, phone }) {
  try {
    const res = await paystack.post('/transaction/initialize', {
      email,
      amount: 1000 * 100, // ₦1000 in kobo
      currency: 'NGN',
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'], // Enable all payment methods
      metadata: {
        vendor: phone,
        plan: 'premium',
        cancel_action: 'https://paymint.ng/subscribe/cancel'
      },
      callback_url: `${BASE_URL}/subscribe/success`,
      // Bank transfer specific settings
      bearer: 'account', // Who bears Paystack charges
      custom_fields: [
        {
          display_name: "Vendor Phone",
          variable_name: "vendor_phone",
          value: phone
        }
      ]
    });
    
    return res.data.data.authorization_url;
  } catch (err) {
    console.error("❌ Paystack init error:", err.response?.data || err.message);
    return null;
  }
}

// ✅ Create dedicated bank transfer payment
async function createBankTransferPayment({ email, phone }) {
  try {
    // Step 1: Initialize transaction
    const initRes = await paystack.post('/transaction/initialize', {
      email,
      amount: 1000 * 100,
      currency: 'NGN',
      channels: ['bank_transfer'], // Only bank transfer
      metadata: {
        vendor: phone,
        plan: 'premium',
        payment_method: 'bank_transfer'
      }
    });

    const { reference, access_code } = initRes.data.data;

    // Step 2: Generate dedicated account for this transaction
    const accountRes = await paystack.post('/dedicated_account', {
      email,
      first_name: 'Paymint',
      last_name: 'Customer',
      phone,
      preferred_bank: 'wema-bank', // or 'titan-bank'
      country: 'NG',
      amount: 1000 * 100,
      currency: 'NGN',
      metadata: {
        vendor: phone,
        reference: reference
      }
    });

    return {
      reference,
      account_number: accountRes.data.data.account_number,
      account_name: accountRes.data.data.account_name,
      bank_name: accountRes.data.data.bank.name,
      bank_code: accountRes.data.data.bank.code,
      amount: 1000,
      expires_at: accountRes.data.data.expires_at
    };

  } catch (err) {
    console.error("❌ Bank transfer creation error:", err.response?.data || err.message);
    return null;
  }
}

// ✅ Handle different webhook events (updated)
async function handleWebhook(eventData) {
  try {
    console.log(`🔔 Webhook event: ${eventData.event}`);
    
    switch (eventData.event) {
      case 'charge.success':
        await handleSuccessfulCharge(eventData.data);
        break;
      
      case 'charge.failed':
        await handleFailedCharge(eventData.data);
        break;
      
      // Bank transfer specific events
      case 'transfer.success':
        await handleSuccessfulTransfer(eventData.data);
        break;
      
      case 'transfer.failed':
        await handleFailedTransfer(eventData.data);
        break;
      
      // Dedicated account events
      case 'dedicated_account.assign.success':
        await handleDedicatedAccountAssigned(eventData.data);
        break;
      
      case 'dedicated_account.assign.failed':
        await handleDedicatedAccountFailed(eventData.data);
        break;
      
      default:
        console.log(`ℹ️ Unhandled webhook event: ${eventData.event}`);
    }
  } catch (error) {
    console.error('❌ Webhook handling error:', error);
    throw error;
  }
}

// ✅ Handle successful charge (works for both card and bank transfer)
async function handleSuccessfulCharge(data) {
  const { metadata, customer, amount, reference, channel } = data;
  
  if (!metadata || !metadata.vendor) {
    console.log('❌ No vendor metadata in successful charge');
    return;
  }

  const vendorPhone = metadata.vendor;
  
  // Update vendor subscription
  await Vendor.findOneAndUpdate(
    { phone: vendorPhone },
    { 
      plan: 'premium',
      subscriptionDate: new Date(),
      subscriptionAmount: amount / 100,
      paymentStatus: 'paid',
      paymentReference: reference,
      paymentMethod: channel, // 'card', 'bank_transfer', etc.
      lastPaymentDate: new Date()
    },
    { new: true }
  );

  console.log(`✅ Vendor ${vendorPhone} upgraded to premium via ${channel}`);
}

// ✅ Handle bank transfer specific success
async function handleSuccessfulTransfer(data) {
  // This is for outgoing transfers, not incoming payments
  // Usually not needed for subscription payments
  console.log('💸 Transfer successful:', data.reference);
}

// ✅ Handle dedicated account assignment
async function handleDedicatedAccountAssigned(data) {
  const { customer, metadata } = data;
  
  if (metadata && metadata.vendor) {
    console.log(`🏦 Dedicated account assigned to vendor: ${metadata.vendor}`);
    
    // You can store the dedicated account info if needed
    await Vendor.findOneAndUpdate(
      { phone: metadata.vendor },
      { 
        dedicatedAccount: {
          account_number: data.account_number,
          account_name: data.account_name,
          bank_name: data.bank.name,
          assigned_at: new Date()
        }
      }
    );
  }
}

// ✅ Handle dedicated account assignment failure
async function handleDedicatedAccountFailed(data) {
  console.log('❌ Dedicated account assignment failed:', data);
}

// ✅ Get transaction details
async function getTransactionDetails(reference) {
  try {
    const res = await paystack.get(`/transaction/verify/${reference}`);
    return res.data.data;
  } catch (err) {
    console.error("❌ Transaction details error:", err.response?.data || err.message);
    return null;
  }
}

module.exports = {
  generateSubscriptionLink,
  createBankTransferPayment,
  validateWebhook,
  handleWebhook,
  verifyTransaction: getTransactionDetails
};
