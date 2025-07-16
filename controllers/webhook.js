// controllers/webhook.js
const crypto = require('crypto');
const Vendor = require('../models/Vendor');
const { sendPaymentConfirmation, sendPaymentFailure } = require('../services/whatsapp');
const { connectWhatsApp } = require('../services/socket'); // We’ll define this below 👇

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

// ✅ Validate webhook signature
function validatePaystackSignature(signature, rawBody) {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

// ✅ Webhook handler
async function handlePaystackWebhook(req, res) {
  try {
    const signature = req.headers['x-paystack-signature'];
    const rawBody = req.rawBody;

    if (!signature || !validatePaystackSignature(signature, rawBody)) {
      return res.status(400).send('Invalid signature');
    }

    const event = JSON.parse(rawBody);
    const { event: type, data } = event;

    switch (type) {
      case 'charge.success':
        await handleSuccessfulPayment(data);
        break;
      case 'charge.failed':
        await handleFailedPayment(data);
        break;
      default:
        console.log(`ℹ️ Unhandled webhook event: ${type}`);
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('Server error');
  }
}

// ✅ Payment success logic
async function handleSuccessfulPayment(data) {
  const { metadata, amount, reference, channel } = data;
  if (!metadata?.vendor) return;

  const phone = metadata.vendor;
  const updatedVendor = await Vendor.findOneAndUpdate(
    { phone },
    {
      plan: 'premium',
      subscriptionDate: new Date(),
      subscriptionAmount: amount / 100,
      paymentStatus: 'paid',
      paymentReference: reference,
      paymentMethod: channel,
      lastPaymentDate: new Date()
    },
    { new: true }
  );

  if (updatedVendor) {
    const sock = await connectWhatsApp(); // 👇 Step 2
    await sendPaymentConfirmation(sock, phone, { amount, reference, channel });
  }
}

// ✅ Payment failure logic
async function handleFailedPayment(data) {
  const { metadata, reference, channel, gateway_response } = data;
  if (!metadata?.vendor) return;

  const phone = metadata.vendor;
  await Vendor.findOneAndUpdate(
    { phone },
    { paymentStatus: 'failed' }
  );

  const sock = await connectWhatsApp(); // 👇 Step 2
  await sendPaymentFailure(sock, phone, {
    reference,
    channel,
    gateway_response
  });
}

module.exports = {
  handlePaystackWebhook,
  validatePaystackSignature
};
