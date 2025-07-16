const express = require('express');
const router = express.Router();
const { verifyTransaction } = require('../services/paystack');
const Vendor = require('../models/Vendor'); // MongoDB model
const db = require('../services/db').getDB();

// ✅ SUCCESS PAGE: Handles Paystack redirect after payment
router.get('/success', async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).send(`
        <html>
          <head><title>Payment Error</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Payment Error</h1>
            <p>No payment reference found.</p>
          </body>
        </html>
      `);
    }

    // ✅ Verify with Paystack
    const transaction = await verifyTransaction(reference);

    if (!transaction || transaction.status !== 'success') {
      return res.status(400).send(`
        <html>
          <head><title>Verification Failed</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Verification Failed</h1>
            <p>Could not verify your transaction.</p>
            <p>Please contact support with ref: <strong>${reference}</strong></p>
          </body>
        </html>
      `);
    }

    const phone = transaction.customer.phone || transaction.metadata?.custom_fields?.find(f => f.display_name === "Phone Number")?.value;

    if (!phone) {
      return res.status(400).send(`
        <html>
          <head><title>Missing Phone</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Missing Vendor Phone</h1>
            <p>We could not identify your WhatsApp number from the transaction.</p>
          </body>
        </html>
      `);
    }

    // ✅ Update Vendor to Premium
    const vendor = await Vendor.findOne({ phone });

    if (!vendor) {
      return res.status(404).send(`
        <html>
          <head><title>Vendor Not Found</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Vendor Not Found</h1>
            <p>No vendor registered with phone: <strong>${phone}</strong></p>
          </body>
        </html>
      `);
    }

    if (vendor.subscriptionStatus === 'premium') {
      return res.send(`
        <html>
          <head><title>Already Upgraded</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>✅ You're Already Premium</h1>
            <p>No further action needed.</p>
          </body>
        </html>
      `);
    }

    await Vendor.updateOne(
      { phone },
      {
        $set: {
          subscriptionStatus: 'premium',
          subscriptionDate: new Date(),
          reference,
        }
      }
    );

    // ✅ Log transaction to DB (optional)
    await db.collection("payments").insertOne({
      phone,
      reference,
      amount: transaction.amount,
      status: transaction.status,
      gateway_response: transaction.gateway_response,
      createdAt: new Date(),
    });

    // ✅ Final Success Response
    return res.send(`
      <html>
        <head>
          <title>Payment Successful</title>
          <style>
            body { font-family: Arial; background: #f0f8ff; text-align: center; padding: 40px; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .success { color: #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✅ Payment Successful!</h1>
            <p>You've been upgraded to <strong>Paymint Premium</strong>.</p>
            <p><strong>Amount:</strong> ₦${(transaction.amount / 100).toLocaleString()}</p>
            <p><strong>Reference:</strong> ${reference}</p>
            <hr>
            <p>🎉 Return to WhatsApp and enjoy premium features.</p>
          </div>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("❌ Payment Success Error:", err);
    return res.status(500).send(`
      <html>
        <head><title>Server Error</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Server Error</h1>
          <p>Something went wrong. Please contact support.</p>
        </body>
      </html>
    `);
  }
});

// ✅ CANCEL PAGE
router.get('/cancel', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Payment Cancelled</title>
        <style>
          body { font-family: Arial; background: #fff0f0; text-align: center; padding: 50px; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .cancel { color: #dc3545; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="cancel">❌ Payment Cancelled</h1>
          <p>You cancelled the payment process.</p>
          <p>No charges were made.</p>
          <hr>
          <p>Return to WhatsApp and type <strong>/subscribe</strong> to try again.</p>
        </div>
      </body>
    </html>
  `);
});

module.exports = router;
