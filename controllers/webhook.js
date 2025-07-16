/ controllers/webhook.js
const crypto = require('crypto');
const Vendor = require('../models/Vendor');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

// ✅ Validate Paystack webhook signature
function validatePaystackSignature(signature, body) {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(body)
    .digest('hex');
  return hash === signature;
}

// ✅ Handle Paystack webhook
async function handlePaystackWebhook(req, res) {
  try {
    const signature = req.headers['x-paystack-signature'];
    
    if (!signature) {
      console.log('❌ No Paystack signature found');
      return res.status(400).send('No signature');
    }

    // Validate signature
    const isValid = validatePaystackSignature(signature, req.body);
    if (!isValid) {
      console.log('❌ Invalid Paystack signature');
      return res.status(400).send('Invalid signature');
    }

    // Parse the webhook body
    const event = JSON.parse(req.body);
    console.log('🔔 Paystack webhook received:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulPayment(event.data);
        break;
      
      case 'charge.failed':
        await handleFailedPayment(event.data);
        break;
      
      default:
        console.log(`ℹ️ Unhandled event type: ${event.event}`);
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send('Server error');
  }
}

// ✅ Handle successful payment
async function handleSuccessfulPayment(data) {
  try {
    const { metadata, customer, amount } = data;
    
    if (!metadata || !metadata.vendor) {
      console.log('❌ No vendor info in payment metadata');
      return;
    }

    const vendorPhone = metadata.vendor;
    console.log(`💳 Processing successful payment for vendor: ${vendorPhone}`);

    // Update vendor to premium
    const vendor = await Vendor.findOneAndUpdate(
      { phone: vendorPhone },
      { 
        plan: 'premium',
        subscriptionDate: new Date(),
        subscriptionAmount: amount / 100, // Convert from kobo to naira
        paymentStatus: 'paid'
      },
      { new: true }
    );

    if (!vendor) {
      console.log(`❌ Vendor not found: ${vendorPhone}`);
      return;
    }

    console.log(`✅ Vendor ${vendorPhone} upgraded to premium successfully`);

    // Optional: Send WhatsApp confirmation message
    // You can call your WhatsApp bot function here to send a confirmation
    // await sendWhatsAppConfirmation(vendorPhone, vendor);

  } catch (error) {
    console.error('❌ Error processing successful payment:', error);
  }
}

// ✅ Handle failed payment
async function handleFailedPayment(data) {
  try {
    const { metadata, customer } = data;
    
    if (!metadata || !metadata.vendor) {
      console.log('❌ No vendor info in failed payment metadata');
      return;
    }

    const vendorPhone = metadata.vendor;
    console.log(`❌ Payment failed for vendor: ${vendorPhone}`);

    // Update vendor payment status
    await Vendor.findOneAndUpdate(
      { phone: vendorPhone },
      { paymentStatus: 'failed' }
    );

    // Optional: Send WhatsApp failure notification
    // await sendWhatsAppFailureNotification(vendorPhone);

  } catch (error) {
    console.error('❌ Error processing failed payment:', error);
  }
}

module.exports = {
  handlePaystackWebhook,
  validatePaystackSignature
};